# Apps Script backup — Faimgo data sink

`Code.gs` in this folder is a manual backup of the Google Apps Script that
receives leads, funnel events, feedback, and mail-failure alerts from the
Faimgo site and writes them into the "Faimgo Data" Google Sheet (tabs:
Leads, Events, Feedback). It also serves the key-protected read endpoint
used by the automated weekly/quarterly summaries.

- Source: Apps Script project "Untitled project", opened from the
  "Faimgo Data" Sheet via Extensions → Apps Script
  (project id `1OM5lbDj_QmsH9R0BtzidCGWEaJdHszWUuqIe4ZJg2nsCPgxaucINp44a`).
- Version backed up: v11 (per the header comment in the file), last
  modified in the editor Aug 2, 2026.
- Backed up: Aug 20, 2026, by transcribing the live editor content —
  this is a snapshot, not a live sync. If the script is edited again in
  the Apps Script editor, this file will drift out of date until it's
  re-backed-up the same way.

**One redaction**: the live source's header comment names the specific
value of an old/deprecated FAIMGO read key inline (the file's own v11
notes explain *why* that was a mistake — secrets in source travel
wherever the source travels, including into a public repo like this
one). That value has been replaced with `[REDACTED]` here. It should
already be dead — the v11 upgrade moved the real key into Script
Properties (`FAIMGO_READ_KEY`) precisely so the deployed key is never in
source control. Worth a quick check in the Apps Script editor that the
old key really doesn't work anymore, and if it's ever reused anywhere,
rotate it.

This script is not built/deployed from this repo — it's edited directly
in the Apps Script web editor and deployed from there. This copy exists
so the logic isn't only living in one browser tab.
