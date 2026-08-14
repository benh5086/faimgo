import Link from "next/link";

/*
  FAIMGO — PRIVACY (/privacy)

  This page exists because the footer linked to href="#" while the product
  asked strangers for an email address. A privacy link that goes nowhere on
  a site that collects email is the worst broken link a product can have.

  WHAT THIS IS: a factual statement of what the code actually does, written
  by reading the code — every claim below is checkable against store.js,
  track.js, api/lead/route.js and api/feedback/route.js. Where a practice is
  weak (Vercel's one-hour log retention, no delete button yet) it says so
  rather than reaching for the usual reassuring phrasing.

  WHAT THIS IS NOT: legal advice, and not a lawyer's document. It states
  practice, not promises Ben has not agreed to make. It needs revisiting the
  moment any of these three things change: a database exists, accounts exist,
  or anything is shared with a party not named here.

  REVISED Aug 14, 2026, and the reason is the lesson worth keeping.
  Three things had gone stale in seven days:

  1. This page told people that "start the whole thing over" clears what is
     on their device. The v11 batch changed `clearWork()` to ARCHIVE
     completions instead of deleting them — so the page was describing a
     behaviour the product no longer had, and describing it in the one
     direction that matters: it promised a deletion that no longer happens.
  2. The completion record itself (which steps are done, and what came of
     them) was not disclosed at all. It did not exist when this page was
     written on Aug 7 and shipped on Aug 12.
  3. The line about the random id "not being linked to a name" was true and
     incomplete — we store no names, but the id sits in the same Sheet row
     as the email address. Now said outright.

  STANDING RULE THIS PRODUCED: when behaviour changes, check whether any
  public document is still speaking for the old behaviour. A privacy page is
  the highest-consequence place for that to happen, because an inaccurate
  policy is worse than a plain one — the exposure comes from saying something
  untrue, not from saying something simple.

  Deliberately no "Terms" page shipped alongside. Terms is a set of legal
  promises, not a description of behaviour; drafting one is not something to
  do by inference from source code.
*/

export const metadata = {
  title: "Privacy",
  description: "What Faimgo collects, where it goes, and how to get it removed.",
};

const C = {
  cream: "#F1F4F2",
  green: "#1B3A2D",
  gold: "#8A6A14",
  beige: "#E4E8E5",
  gray: "#464C54",
  ink: "#15181B",
  greenSoft: "#E4EEE9",
};

function H({ children }) {
  return <h2 className="font-display text-[24px] mt-9 mb-3" style={{ color: C.green }}>{children}</h2>;
}

function P({ children }) {
  return <p className="text-[17px] leading-relaxed mb-4" style={{ color: C.ink }}>{children}</p>;
}

export default function Privacy() {
  return (
    <main className="min-h-screen font-sans" style={{ backgroundColor: C.cream }}>
      <div style={{ backgroundColor: C.green }} className="px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight" style={{ color: "#FFFFFF" }}>
          faim<span style={{ color: "#D2A54A" }}>go</span>
        </Link>
        <Link href="/" className="text-[15px] font-medium" style={{ color: "#FFFFFF" }}>Back to Faimgo</Link>
      </div>

      <div className="max-w-[720px] mx-auto px-6 py-12">
        <h1 className="font-display text-3xl md:text-4xl leading-[1.15] mb-4" style={{ color: C.green }}>
          What we collect, and where it goes.
        </h1>
        <P>
          Short version: your assessment answers and, if you give it to us, your email address.
          We use them to build your plan and send it to you. We don&apos;t sell anything to anyone,
          we don&apos;t run ads, and there are no third-party trackers on this site.
        </P>

        <H>What we actually store</H>
        <P>
          <b>On your device.</b> Your answers, the plan we built, the steps you&apos;ve marked as
          done, and a random id are saved in your browser&apos;s local storage so the page can
          remember where you were. The random id is a string of characters and holds nothing about
          who you are — but to be exact: once you finish the assessment, that id sits in the same
          row as the email address you gave us, so treat it as connected to you rather than
          anonymous. It stays in that browser: clearing your browser data deletes it, and it does
          not follow you to another device.
        </P>
        <P>
          <b>On our side.</b> When you finish the assessment we receive your answers, the two paths
          we matched you to, that random id, a count of how many times you&apos;ve visited, and — if
          you entered it — your email address and your answer to &ldquo;what should your plan protect
          you from?&rdquo; We also record which step of the assessment you reached, so we can see
          where people give up. If you send feedback, we receive the message, the rating, the page
          you sent it from and that same random id.
        </P>
        <P>
          <b>What you finish.</b> When you mark a step of your plan as done, we record that — which
          step, and when. If you answer the optional question about whether anything came of it
          yet, we record that answer too. Both are things you choose to tell us: you can untick a
          step, change your answer, or remove it, at any time. We keep this because knowing which
          steps actually work for real people is the only way the plans get better — and, later,
          it&apos;s what a member can point to as proof of what they&apos;ve actually done.
        </P>

        <H>Who else sees it</H>
        <P>
          Three services, and nobody else. <b>Vercel</b> hosts the site and briefly holds server logs.
          <b> Resend</b> sends your plan email and therefore handles your email address. <b>Google
          Sheets</b> is where the records are kept — a private spreadsheet that only we can open.
          That is the complete list. Nothing is sold, and nothing is shared for advertising.
        </P>

        <H>How long we keep it</H>
        <P>
          Honestly: the spreadsheet has no expiry date yet, so assume records stay until you ask us
          to remove them. Server logs are short-lived — the host keeps them about an hour. We would
          rather tell you that than write a retention period we don&apos;t currently enforce.
        </P>

        <H>Cookies</H>
        <P>
          None. No advertising cookies, no analytics cookies, no consent banner to dismiss. The site
          uses your browser&apos;s local storage, which is a different thing: it stays on your
          machine and is never sent anywhere except as described above. The fonts are served from
          this site, not from a third party.
        </P>

        <H>Getting your data removed</H>
        <P>
          There is no self-serve delete button yet — building one is on the list and we&apos;re not
          going to pretend otherwise. In the meantime, use the <b>Contact</b> link at the bottom of
          the home page, or reply to the plan email, and say you want your record deleted. We&apos;ll
          remove it from the spreadsheet and confirm. To clear what&apos;s on your own device, clear
          your browser data for this site — that removes everything, the finished steps included.
        </P>
        <P>
          One thing worth being straight about: <b>&ldquo;start over&rdquo; is not a delete.</b> It
          clears your answers and your plan so you can take the assessment again, but it
          deliberately keeps the steps you already finished, because having those quietly disappear
          is the last thing most people would want. If you want them gone, clear your browser data
          or ask us.
        </P>

        <H>Children</H>
        <P>Faimgo is meant for adults making money on the side. It isn&apos;t designed or intended for children.</P>

        <H>When this changes</H>
        <P>
          We&apos;re small and building in the open, so this will change — particularly when accounts
          and a real database arrive, which is the point at which some of the answers above get
          better. We&apos;ll update this page when it does.
        </P>

        <div className="p-5 rounded-2xl mt-10" style={{ backgroundColor: C.greenSoft }}>
          <p className="text-[16px] leading-relaxed" style={{ color: C.green }}>
            Questions about any of this, or want your record removed? Use the Contact link on the
            home page — a real person reads it.
          </p>
        </div>

        <p className="text-[14px] mt-8" style={{ color: C.gray }}>Last updated: August 14, 2026.</p>
      </div>
    </main>
  );
}
