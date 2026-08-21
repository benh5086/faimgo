/**
 * Faimgo data sink — Google Apps Script (v11)
 * ==================================================================
 * Receives leads, funnel events, feedback and mail-failure alerts from
 * the Faimgo site and appends each to its own tab. Also serves a
 * key-protected read endpoint so the automated weekly/quarterly
 * summaries can fetch the data.
 *
 * One deployment handles everything — LEAD_WEBHOOK_URL and
 * FEEDBACK_WEBHOOK_URL both point at this same web-app URL; the script
 * routes each message to the right tab.
 *
 *
 * WHAT CHANGED IN v11, AND WHY
 * ------------------------------------------------------------------
 *
 * 1. THE IDENTITY SPINE WAS BEING THROWN AWAY.
 *    Since Aug 1 the site has sent `fid` (the person, stable across
 *    visits) and `visits` on every single payload. This script listed
 *    neither in its headers, so both were dropped on arrival. The only
 *    durable store we have was discarding the exact field that tells
 *    three visitors apart from one visitor returning three times —
 *    which means every funnel number in the Sheet has been
 *    uninterpretable, not merely incomplete. Both are now recorded on
 *    Leads and on Events.
 *
 * 2. ADDING A HEADER TO THE ARRAY USED TO DO NOTHING.
 *    The old line was `if (sh.getLastRow() === 0) sh.appendRow(headers)`
 *    — headers were written once, when the tab was empty, and never
 *    looked at again. Leads already had eight rows, so editing the
 *    headers array would have appended eleven values under an
 *    eight-column header and silently misaligned every new row against
 *    the old ones. This is why the previous note in the open-items doc
 *    ("the Sheet will pick up new columns automatically") was wrong.
 *
 *    syncHeaders() below fixes the class of bug, not the instance: it
 *    reads row 1, appends only the headers that are genuinely missing,
 *    and then builds each row *against the order actually in the
 *    sheet*. Existing columns keep their positions, existing data stays
 *    aligned, and old rows simply have blanks in the new columns. Adding
 *    a field from here on is a one-word edit to a headers array.
 *
 * 3. THE READ KEY IS NO LONGER IN THIS FILE.
 *    It now lives in Script Properties under FAIMGO_READ_KEY. A secret
 *    written into source is a secret that travels wherever the source
 *    travels — into screenshots, chat transcripts, and (the way this
 *    project is set up) potentially a public repository. The read
 *    endpoint FAILS CLOSED: if the property is unset, every GET is
 *    refused. That is deliberate. A missing key must never mean "no
 *    check to perform."
 *
 * 4. MAIL FAILURES ARE NOW STAMPED BACK ONTO THE LEAD.
 *    When a plan email fails, /api/lead already POSTs an alert here
 *    carrying {status, sid, fid} in its context. That alert used to
 *    land in Feedback and stop there, unconnected to the lead it was
 *    about. It is still recorded there, and now it also writes
 *    `mailStatus` onto the matching Leads row.
 *
 *    HONEST LIMIT — read this before trusting the column. A BLANK
 *    mailStatus means "no failure was reported," NOT "delivered."
 *    Two reasons. First, /api/lead forwards the lead in parallel with
 *    sending the mail, so no success status exists to forward yet;
 *    filling in the success case needs a small change in route.js and
 *    a Vercel deploy. Second, even "sent" means Resend accepted the
 *    message, never that it arrived — that needs bounce webhooks and a
 *    real database. So this column is a failure log, and it is labelled
 *    as one. Do not let it grow into a delivery claim.
 *
 * 5. Feedback gains an `fid` column. It will stay empty until the
 *    widget sends one: /api/feedback destructures a fixed field list
 *    and drops anything else, so feedback currently cannot be linked to
 *    the person who left it. The column is here so that the day the
 *    front end sends it, no Sheet work is needed.
 *
 * There is deliberately NO whitelist of event names. Events is generic
 * on purpose — a new funnel event should show up in the Sheet the day
 * it ships, not the day someone remembers to add it here. A whitelist
 * would fail silently, which is the failure mode this whole file is
 * trying to get out of.
 *
 *
 * ONE-TIME SETUP AFTER PASTING THIS IN
 * ------------------------------------------------------------------
 *  1. Project Settings (the gear, left sidebar) → Script Properties
 *     → Add script property
 *       Property: FAIMGO_READ_KEY
 *       Value:    a new random string you invent and keep yourself
 *     → Save. Do not put it in a doc, a chat, or a screenshot.
 *  2. Deploy → Manage deployments → the pencil → Version: New version
 *     → Deploy. The web-app URL does not change, so nothing in Vercel
 *     needs touching.
 *  3. The old key [REDACTED — was in the live source comment; already
 *     superseded by the Script Properties key above] stops working the
 *     moment step 1 and 2 are done. That is the point.
 */

/* ============================================================
   TAB SHAPES
   Order here is the order NEW columns get appended in. Columns
   already in the sheet keep whatever position they have.
   ============================================================ */

var HEADERS = {
  Leads: ["ts", "email", "sid", "fid", "visits", "version",
          "otherIdea", "protectFrom", "mailStatus", "results", "answers"],
  Events: ["ts", "event", "sid", "fid", "visits"],
  Feedback: ["ts", "kind", "rating", "category", "message", "email", "fid", "context", "page"]
};

/* ============================================================
   HEADER RECONCILIATION
   ============================================================ */

/**
 * Returns the header order actually present in the sheet after making
 * sure every desired header exists. Never moves or removes a column.
 */
function syncHeaders(sh, desired) {
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, desired.length).setValues([desired]);
    return desired.slice();
  }

  var width = Math.max(sh.getLastColumn(), 1);
  var existing = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) {
    return String(h === null || h === undefined ? "" : h).trim();
  });

  // Drop trailing blanks so we append immediately after the last real header.
  while (existing.length && existing[existing.length - 1] === "") existing.pop();

  var missing = desired.filter(function (h) { return existing.indexOf(h) === -1; });
  if (missing.length) {
    sh.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
    existing = existing.concat(missing);
  }
  return existing;
}

/** Builds a row array matching the sheet's own column order. */
function rowFor(order, values) {
  return order.map(function (h) {
    var v = values[h];
    return (v === undefined || v === null) ? "" : v;
  });
}

function appendTo(ss, name, values) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  var order = syncHeaders(sh, HEADERS[name]);
  sh.appendRow(rowFor(order, values));
  return sh;
}

/* ============================================================
   MAIL-FAILURE → LEAD STAMP
   ============================================================ */

/**
 * Finds the most recent Leads row with this sid and writes mailStatus.
 * Searches newest-first and stops at the first match — a retry should
 * mark the attempt it belongs to, not the oldest one sharing the sid.
 *
 * Returns quietly if there is no match. The lead POST and the alert
 * POST are separate HTTP requests and can in principle arrive out of
 * order; losing the cross-link is acceptable, losing the alert is not,
 * and the alert is already safely in Feedback before this runs.
 */
function stampMailStatus(ss, sid, status) {
  if (!sid || !status) return;
  var sh = ss.getSheetByName("Leads");
  if (!sh || sh.getLastRow() < 2) return;

  var order = syncHeaders(sh, HEADERS.Leads);
  var sidCol = order.indexOf("sid");
  var statusCol = order.indexOf("mailStatus");
  if (sidCol === -1 || statusCol === -1) return;

  var last = sh.getLastRow();
  var sids = sh.getRange(2, sidCol + 1, last - 1, 1).getValues();
  for (var i = sids.length - 1; i >= 0; i--) {
    if (String(sids[i][0]) === String(sid)) {
      sh.getRange(i + 2, statusCol + 1).setValue(status);
      return;
    }
  }
}

/** Pulls {status, sid} out of the alert's context field, whatever shape it is. */
function parseAlertContext(context) {
  if (!context) return {};
  if (typeof context === "object") return context;
  try { return JSON.parse(String(context)) || {}; } catch (err) { return {}; }
}

/* ============================================================
   WRITE ENDPOINT
   ============================================================ */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.kind) {
      // Feedback, contact messages, and mail-failure alerts.
      appendTo(ss, "Feedback", {
        ts: data.ts,
        kind: data.kind,
        rating: data.rating,
        category: data.category,
        message: data.message,
        email: data.email,
        fid: data.fid,
        context: data.context,
        page: data.page
      });

      if (data.kind === "alert" && data.category === "mail-failure") {
        var ctx = parseAlertContext(data.context);
        stampMailStatus(ss, ctx.sid, ctx.status || "error");
      }

    } else if (data.type === "event") {
      // Funnel events. `name` on the wire, `event` in the sheet — the
      // column was named before the payload was, and renaming it now
      // would orphan 50-odd existing rows for no gain.
      appendTo(ss, "Events", {
        ts: data.ts,
        event: data.name,
        sid: data.sid,
        fid: data.fid,
        visits: data.visits
      });

    } else {
      // Leads (assessment completions).
      appendTo(ss, "Leads", {
        ts: data.ts,
        email: data.email,
        sid: data.sid,
        fid: data.fid,
        visits: data.visits,
        version: data.version,
        otherIdea: data.otherIdea,
        protectFrom: data.protectFrom,
        mailStatus: data.mailStatus,   // empty today; see note 4 above
        results: JSON.stringify(data.results || ""),
        answers: JSON.stringify(data.answers || "")
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ============================================================
   READ ENDPOINT
   ============================================================ */

function readKey() {
  var k = PropertiesService.getScriptProperties().getProperty("FAIMGO_READ_KEY");
  k = k ? String(k).trim() : "";
  // A short key is treated as no key. Refusing everything is the correct
  // behaviour for a misconfigured lock.
  return k.length >= 12 ? k : null;
}

function doGet(e) {
  var expected = readKey();
  var given = (e && e.parameter) ? e.parameter.key : null;

  if (!expected || !given || String(given) !== expected) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: expected ? "unauthorized" : "read-key-not-configured"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var tab = e.parameter.tab || "Feedback";
  var limit = parseInt(e.parameter.limit || "300", 10);
  if (!(limit > 0)) limit = 300;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tab);
  if (!sh || sh.getLastRow() < 2) {
    return ContentService.createTextOutput(JSON.stringify({ ok: true, tab: tab, rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var values = sh.getDataRange().getValues();
  var headers = values[0];
  var rows = values.slice(1);
  rows = rows.slice(Math.max(0, rows.length - limit)); // most recent N

  var out = rows.map(function (r) {
    var o = {};
    headers.forEach(function (h, i) { if (h !== "") o[h] = r[i]; });
    return o;
  });

  return ContentService.createTextOutput(JSON.stringify({ ok: true, tab: tab, rows: out }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   SELF-TEST — run this from the editor after pasting.
   Select `selfTest` in the function dropdown, press Run, then read
   View → Logs. It writes nothing; it only reports what it sees.
   ============================================================ */

function selfTest() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ["Leads", "Events", "Feedback"].forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { Logger.log(name + ": MISSING"); return; }
    var order = syncHeaders(sh, HEADERS[name]);
    var missing = HEADERS[name].filter(function (h) { return order.indexOf(h) === -1; });
    Logger.log(name + ": rows=" + Math.max(0, sh.getLastRow() - 1) +
      " | columns=" + order.join(",") +
      " | missing=" + (missing.length ? missing.join(",") : "none"));
  });
  Logger.log("read key configured: " + (readKey() ? "yes" : "NO — the read endpoint will refuse everything"));
}
