"use client";

/* ============================================================
   FAIMGO — Admin dashboard (Sep 13 2026)

   A back-office view for Ben of what the database actually holds. Ben asked
   for "how many people visited" — the honest answer, stated on the page, is
   that Postgres does NOT record raw pageviews. A visitor is only mirrored to
   the DB once they leave a trace: an email (accounts), a saved plan, a coach
   turn, a completed step. So this board is a FUNNEL/ACTIVITY view, not a
   traffic counter. For raw traffic, enable Vercel Analytics (a one-click
   toggle in the Vercel project) — noted in the UI.

   Auth: the page holds the ADMIN_TOKEN in memory only (re-enter on refresh)
   and sends it to api/admin/stats in the `x-admin-token` header, never a URL.
   ============================================================ */

import { useState } from "react";
import { pathById } from "../../lib/paths.js";

const C = {
  green: "#C0603A",
  gold: "#9A4A12",
  beige: "#E8DCCD",
  gray: "#6B5A52",
  ink: "#2A1A18",
  cream: "#F4EADF",
  greenSoft: "#F7E3D8",
  white: "#FFFFFF",
};

function pathLabel(id) {
  if (!id || id === "(none)") return "(no path / left blank)";
  return pathById(id)?.name || id;
}

function Tile({ label, value, sub }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.white, border: `1px solid ${C.beige}` }}>
      <div className="text-[13px]" style={{ color: C.gray }}>{label}</div>
      <div className="text-[30px] font-bold leading-tight" style={{ color: C.green }}>
        {value ?? "—"}
      </div>
      {sub ? <div className="text-[12px] mt-1" style={{ color: C.gray }}>{sub}</div> : null}
    </div>
  );
}

function BarRow({ label, n, max }) {
  const pct = max > 0 ? Math.max(2, Math.round((n / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 text-[14px]" style={{ color: C.ink }}>
      <div style={{ width: 190, flexShrink: 0 }} className="truncate">{label}</div>
      <div className="flex-1 rounded" style={{ backgroundColor: C.cream, height: 18 }}>
        <div className="rounded h-full" style={{ width: pct + "%", backgroundColor: C.green }} />
      </div>
      <div style={{ width: 44, textAlign: "right" }} className="tabular-nums font-semibold">{n}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.white, border: `1px solid ${C.beige}` }}>
      <div className="text-[15px] font-bold mb-3" style={{ color: C.green }}>{title}</div>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error | ok
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  async function load(e) {
    if (e) e.preventDefault();
    if (!token.trim()) return;
    setStatus("loading");
    setErr("");
    let res, body;
    try {
      res = await fetch("/api/admin/stats", { headers: { "x-admin-token": token.trim() } });
      body = await res.json();
    } catch {
      setStatus("error");
      setErr("Couldn't reach the stats endpoint. Try again in a moment.");
      return;
    }
    if (res.status === 503 || body?.reason === "admin_disabled") {
      setStatus("error");
      setErr("Admin dashboard is off: ADMIN_TOKEN isn't set in the Vercel environment yet. Add it (Vercel → Project → Settings → Environment Variables), redeploy, then use that same value here.");
      return;
    }
    if (res.status === 401 || body?.reason === "unauthorized") {
      setStatus("error");
      setErr("That token didn't match. Check the ADMIN_TOKEN value in Vercel.");
      return;
    }
    if (!body?.ok) {
      setStatus("error");
      setErr(body?.reason === "no_db" ? "No database is configured (DATABASE_URL missing)." : "Something went wrong loading stats.");
      return;
    }
    setData(body);
    setStatus("ok");
  }

  const wrap = { maxWidth: 1000, margin: "0 auto" };

  return (
    <main style={{ backgroundColor: C.cream, minHeight: "100vh" }}>
      <div style={wrap} className="px-4 py-8">
        <h1 className="text-[26px] font-bold" style={{ color: C.green }}>Faimgo · Admin</h1>
        <p className="text-[14px] mt-1" style={{ color: C.gray }}>
          What the database holds. This is a funnel/activity view, not raw traffic.
        </p>

        {status !== "ok" && (
          <form onSubmit={load} className="mt-6 flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-[13px] mb-1" style={{ color: C.gray }}>Admin token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="paste ADMIN_TOKEN"
                className="rounded-lg px-3 py-2 text-[15px] outline-none"
                style={{ border: `1px solid ${C.beige}`, color: C.ink, backgroundColor: C.white, width: 320 }}
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading" || !token.trim()}
              className="rounded-lg px-4 py-2 text-[15px] font-bold"
              style={{
                backgroundColor: status === "loading" || !token.trim() ? C.beige : C.green,
                color: status === "loading" || !token.trim() ? C.gray : C.cream,
              }}
            >
              {status === "loading" ? "Loading…" : "Load"}
            </button>
          </form>
        )}

        {err && (
          <p className="mt-4 text-[14px] rounded-lg px-3 py-2" style={{ backgroundColor: "#FBEDED", color: "#7A2E2E", border: "1px solid #E7C9C9" }}>
            {err}
          </p>
        )}

        {status === "ok" && data && (
          <>
            <p className="mt-4 text-[12px] rounded-lg px-3 py-2" style={{ backgroundColor: C.greenSoft, color: C.green, border: `1px solid ${C.beige}` }}>
              Traffic below counts real arrivals — every page load fires a beacon, so someone who came and left
              (a bounce) still counts, tracked by device, no IP. Two caveats: arrivals only accumulate from when
              this shipped (older visits live only in the Leads Sheet, not backfilled), and a visitor who blocks
              scripts won&apos;t be counted. Everything under &ldquo;Traffic&rdquo; is that; everything else is what
              the database stores (accounts, plans, coach). Generated {new Date(data.generatedAt).toLocaleString()}.
            </p>

            {/* Traffic — top of funnel (from the events mirror, sql/006). */}
            <div className="mt-5">
              <div className="text-[15px] font-bold mb-3" style={{ color: C.green }}>Traffic</div>
              {!data.traffic ? (
                <p className="text-[14px] rounded-lg px-3 py-2" style={{ backgroundColor: C.cream, color: C.gray, border: `1px solid ${C.beige}` }}>
                  No traffic data yet. Run <b>sql/006_events.sql</b> in Neon and deploy the events mirror — arrivals start showing from that point on.
                </p>
              ) : (
                <>
                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                    <Tile label="Arrivals (page loads)" value={data.traffic.arrivals} sub={`+${data.traffic.arrivals_7d ?? 0} last 7d`} />
                    <Tile label="Unique visitors" value={data.traffic.unique_visitors} sub="distinct devices" />
                    <Tile label="Sittings" value={data.traffic.sittings} sub="distinct sessions" />
                    <Tile
                      label="Came but didn't start"
                      value={data.traffic.funnel ? Math.max(0, (data.traffic.funnel.arrived || 0) - (data.traffic.funnel.started || 0)) : "—"}
                      sub={data.traffic.funnel ? `${data.traffic.funnel.arrived ?? 0} arrived · ${data.traffic.funnel.started ?? 0} started` : ""}
                    />
                  </div>
                  <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                    <Section title="Funnel (unique visitors)">
                      {data.traffic.funnel ? (
                        <div className="flex flex-col gap-2">
                          {[
                            { label: "Arrived", n: data.traffic.funnel.arrived || 0 },
                            { label: "Clicked the CTA", n: data.traffic.funnel.clicked_cta || 0 },
                            { label: "Started assessment", n: data.traffic.funnel.started || 0 },
                          ].map((r) => (
                            <BarRow key={r.label} label={r.label} n={r.n} max={data.traffic.funnel.arrived || 1} />
                          ))}
                        </div>
                      ) : <p className="text-[14px]" style={{ color: C.gray }}>No events yet.</p>}
                    </Section>
                    <Section title="Arrivals — last 14 days">
                      {(data.traffic.daily || []).length === 0 ? (
                        <p className="text-[14px]" style={{ color: C.gray }}>Nothing in the last 14 days.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {data.traffic.daily.map((r) => (
                            <BarRow key={r.day} label={r.day} n={r.n} max={Math.max(...data.traffic.daily.map((x) => x.n))} />
                          ))}
                        </div>
                      )}
                    </Section>
                    <Section title="Arrivals by page">
                      {(data.traffic.byPage || []).length === 0 ? (
                        <p className="text-[14px]" style={{ color: C.gray }}>No arrivals yet.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {data.traffic.byPage.map((r) => (
                            <BarRow key={r.page || "(none)"} label={r.page || "(none)"} n={r.n} max={Math.max(...data.traffic.byPage.map((x) => x.n))} />
                          ))}
                        </div>
                      )}
                    </Section>
                  </div>
                </>
              )}
            </div>

            {/* Top tiles */}
            <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <Tile label="Accounts (emails on file)" value={data.people?.total} sub={`+${data.people?.last7 ?? 0} last 7d · +${data.people?.last30 ?? 0} last 30d`} />
              <Tile label="Plans saved" value={data.plans?.total} sub={`+${data.plans?.last7 ?? 0} last 7d · ${data.plans?.people_with_plan ?? 0} people`} />
              <Tile label="Devices linked" value={data.devices?.linked_devices} sub="fids tied to an account" />
              <Tile label="Coach conversations" value={data.conversations?.total} sub={`+${data.conversations?.last7 ?? 0} last 7d`} />
              <Tile label="Devices that used coach" value={data.ai?.devices_used} sub={`${data.ai?.total_calls ?? 0} calls total`} />
              <Tile label="Coach spend (your cost)" value={data.ai ? "$" + ((data.ai.total_cost_cents || 0) / 100).toFixed(2) : "—"} sub="cumulative API cost" />
              <Tile label="Activation (≥1 step done)" value={data.steps?.people_with_step} sub={`${data.steps?.total_done ?? 0} steps completed`} />
              <Tile label="Reviews" value={data.reviews?.total} />
            </div>

            {/* Breakdowns */}
            <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
              <Section title="Plans by matched path">
                {(data.byPath || []).length === 0 ? (
                  <p className="text-[14px]" style={{ color: C.gray }}>No plans yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.byPath.map((r) => (
                      <BarRow key={r.path} label={pathLabel(r.path)} n={r.n} max={Math.max(...data.byPath.map((x) => x.n))} />
                    ))}
                  </div>
                )}
              </Section>

              <Section title="New plans — last 14 days">
                {(data.daily || []).length === 0 ? (
                  <p className="text-[14px]" style={{ color: C.gray }}>Nothing in the last 14 days.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.daily.map((r) => (
                      <BarRow key={r.day} label={r.day} n={r.n} max={Math.max(...data.daily.map((x) => x.n))} />
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Assessment outcome (mode)">
                {(data.byMode || []).length === 0 ? (
                  <p className="text-[14px]" style={{ color: C.gray }}>No plans yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.byMode.map((r) => (
                      <BarRow key={r.mode} label={r.mode} n={r.n} max={Math.max(...data.byMode.map((x) => x.n))} />
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Coach conversations">
                <div className="text-[13px] mb-2" style={{ color: C.gray }}>By surface</div>
                <div className="flex flex-col gap-2 mb-3">
                  {(data.conversations?.bySurface || []).map((r) => (
                    <BarRow key={r.surface} label={r.surface || "(none)"} n={r.n} max={Math.max(1, ...(data.conversations?.bySurface || []).map((x) => x.n))} />
                  ))}
                </div>
                <div className="text-[13px] mb-2" style={{ color: C.gray }}>By status</div>
                <div className="flex flex-col gap-2">
                  {(data.conversations?.byStatus || []).map((r) => (
                    <BarRow key={r.status} label={r.status || "(none)"} n={r.n} max={Math.max(1, ...(data.conversations?.byStatus || []).map((x) => x.n))} />
                  ))}
                </div>
              </Section>

              <Section title="Most-completed steps">
                {(data.steps?.byPlay || []).length === 0 ? (
                  <p className="text-[14px]" style={{ color: C.gray }}>No steps completed yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.steps.byPlay.map((r) => (
                      <BarRow key={r.play_id} label={r.play_id} n={r.n} max={Math.max(...data.steps.byPlay.map((x) => x.n))} />
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <button
              onClick={() => load()}
              className="mt-5 rounded-lg px-4 py-2 text-[14px] font-semibold"
              style={{ backgroundColor: C.white, color: C.green, border: `1px solid ${C.beige}` }}
            >
              Refresh
            </button>
          </>
        )}
      </div>
    </main>
  );
}
