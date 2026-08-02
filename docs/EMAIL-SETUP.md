# Turning the plan email on — Ben's 10 minutes

The code is done and deployed-ready. Four files changed:

| File | What it is |
|---|---|
| `src/lib/paths.js` | **New.** The path library, moved out of the assessment page so the server can read it. |
| `src/lib/planEmail.js` | **New.** Renders the plan into an email — HTML + plain text. |
| `src/app/api/lead/route.js` | Replaced. Now actually sends. |
| `src/app/assessment/page.js` | Replaced. Imports paths from the new module, and tells the user the truth about whether the mail went out. |

Nothing here can break the results screen. If mail fails, the person still
sees their full plan and gets an honest note instead of a fake confirmation.

## What only you can do

I can't create accounts or handle API keys — that part is yours.

**1. Get a Resend key (about 3 minutes).**
Sign up at resend.com. Free tier is 3,000 emails a month, which is more than
enough until this thing has real traffic. Copy the API key.

**2. Put it in Vercel.**
Project → Settings → Environment Variables. Add:

```
RESEND_API_KEY = re_xxxxxxxxxxxx
```

That alone makes it work — but only to **your own** email address, because
until a domain is verified Resend only delivers to the account owner. Good
for testing, useless for customers. Which brings us to:

**3. Verify a sending domain (about 5 minutes + DNS propagation).**
In Resend → Domains, add whatever domain you'll send from. It gives you two
or three DNS records to paste into your registrar. Once it goes green, add:

```
PLAN_FROM     = Faimgo <plan@yourdomain.com>
PLAN_REPLY_TO = your real inbox
```

`PLAN_REPLY_TO` matters more than it looks. The email ends with "reply and
tell us — a real person reads it." That has to be true, or we've broken a
second promise while fixing the first.

**4. Optional:** `SITE_URL` if you ever move off faimgo.vercel.app.

## How to check it worked

Run the assessment on the live site with your own email. Then look at
Vercel → Logs and search `FAIMGO MAIL`. You'll see one of:

- `"status":"sent"` — it went.
- `"status":"skipped:no-api-key"` — env var missing or not redeployed.
- `"status":"error:403"` — usually the domain isn't verified yet and you're
  sending to an address that isn't yours.

## What this deliberately does not do

It doesn't create an account, and it doesn't give them a link back to a
saved plan. That's the next piece of work, not this one. This piece exists
to close a specific hole: we were asking for an email address with the words
"so you don't lose it" and then letting them lose it. The email now carries
the entire plan in its body, so the promise is kept even with no accounts,
no database, and no login.
