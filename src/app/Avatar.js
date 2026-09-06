"use client";

/*
  Avatar — initials on a deterministic color, no photo upload in this batch
  (see claude/faimgo-profile-scope-sep6.md: ship with a generated placeholder
  first, add real upload once there's a reason to spend the engineering on
  it). Same name always produces the same color, so a person's avatar looks
  consistent everywhere it appears without storing anything extra.
*/

const PALETTE = ["#1B3A2D", "#8A6A14", "#5B3A8A", "#2E5C8A", "#8A3A3A", "#3A8A6E", "#8A5A2E"];

function colorFor(seed) {
  const s = String(seed || "faimgo");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = 56 }) {
  const bg = colorFor(name);
  const initials = initialsFor(name);
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: "50%", backgroundColor: bg,
        color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: Math.round(size * 0.38), flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
