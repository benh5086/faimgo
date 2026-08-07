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
  practice, not promises Ben has not agreed to make. It needs Ben's review
  before it counts as the company's word, and it needs revisiting the moment
  any of these three things change: a database exists, accounts exist, or
  anything is shared with a party not named here.

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
          <b>On your device.</b> Your answers, the plan we built, and a random id are saved in your
          browser&apos;s local storage so the page can remember where you were. The random id is a
          string of characters — it isn&apos;t your name and it isn&apos;t linked to one. It stays
          in that browser: clearing your browser data deletes it, and it does not follow you to
          another device.
        </P>
        <P>
          <b>On our side.</b> When you finish the assessment we receive your answers, the two paths
          we matched you to, that random id, a count of how many times you&apos;ve visited, and — if
          you entered it — your email address and your answer to &ldquo;what should your plan protect
          you from?&rdquo; We also record which step of the assessment you reached, so we can see
          where people give up. If you send feedback, we receive the message, the rating, the page
          you sent it from and that same random id.
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
          your browser data for this site, or use &ldquo;start the whole thing over&rdquo; on the
          results page.
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

        <p className="text-[14px] mt-8" style={{ color: C.gray }}>Last updated: August 7, 2026.</p>
      </div>
    </main>
  );
}
