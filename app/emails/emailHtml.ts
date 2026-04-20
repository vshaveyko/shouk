// Inline-styled, table-based HTML email templates. Each function returns a
// self-contained HTML string safe to drop in a real email renderer later.
// Colors are hex (not oklch) for email-client compat.

const BRAND = {
  ink: "#17212e",
  inkSoft: "#3a4656",
  muted: "#6b7685",
  bg: "#f4f6f9",
  surface: "#ffffff",
  line: "#e4e8ee",
  blue: "#3b7cff",
  blueInk: "#1f55d1",
  blueSoft: "#eaf1ff",
  success: "#19a05a",
  successSoft: "#e4f6ec",
  amber: "#c78018",
  amberSoft: "#fbefd6",
  danger: "#c63939",
  dangerSoft: "#fde7e7",
  purple: "#7c5bf7",
  purpleSoft: "#ece6ff",
};

function logoSvg() {
  return `
    <svg width="22" height="22" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 3 38.5 12.5v19L22 41 5.5 31.5v-19L22 3Z" stroke="#17212e" stroke-width="2.6" stroke-linejoin="round" fill="none"/>
      <circle cx="22" cy="22" r="3.4" fill="#4DB7E8"/>
    </svg>`;
}

function emailShell(inner: string) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Shouks</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.bg};font-family:Inter Tight,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${BRAND.surface};border:1px solid ${BRAND.line};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:18px 24px;border-bottom:1px solid ${BRAND.line};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="font-size:14px;font-weight:600;color:${BRAND.ink};">
                      ${logoSvg()}
                      <span style="vertical-align:middle;margin-left:6px;">Shouks</span>
                    </td>
                    <td align="right" style="font-size:12px;color:${BRAND.muted};">
                      Sent via Shouks
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${inner}
            <tr>
              <td style="padding:18px 24px;background:${BRAND.bg};border-top:1px solid ${BRAND.line};font-size:12px;color:${BRAND.muted};line-height:1.6;">
                You're receiving this because of activity on your Shouks account.<br/>
                <a href="#" style="color:${BRAND.blueInk};text-decoration:none;">Notification settings</a>
                &nbsp;·&nbsp;
                <a href="#" style="color:${BRAND.blueInk};text-decoration:none;">Help</a>
              </td>
            </tr>
          </table>
          <div style="max-width:560px;margin:12px auto 0;font-size:11px;color:${BRAND.muted};text-align:center;">
            Shouks, Inc. · Brooklyn, NY
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function badge(label: string, bg: string, fg: string) {
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${bg};color:${fg};font-size:12px;font-weight:600;">${label}</span>`;
}

function primaryButton(label: string, href: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
    <tr>
      <td style="background:${BRAND.ink};border-radius:10px;">
        <a href="${href}" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${label} &rarr;</a>
      </td>
    </tr>
  </table>`;
}

function outlineButton(label: string, href: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
    <tr>
      <td style="border:1px solid ${BRAND.line};border-radius:10px;background:${BRAND.surface};">
        <a href="${href}" style="display:inline-block;padding:11px 20px;font-size:14px;font-weight:600;color:${BRAND.ink};text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
}

// ──────────────────────────────────────────────────────────────

export function welcomeEmailHtml(opts: { name?: string }) {
  const name = opts.name ?? "there";
  const inner = `
    <tr>
      <td style="padding:32px 24px 8px;">
        ${badge("Welcome", BRAND.blueSoft, BRAND.blueInk)}
        <h1 style="font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;margin:14px 0 8px;color:${BRAND.ink};">
          Welcome to Shouks, ${name}.
        </h1>
        <p style="font-size:15px;line-height:1.55;color:${BRAND.inkSoft};margin:0 0 12px;">
          Shouks is where private marketplaces live — vetted communities for the things you actually care about.
          You're in the door; the rest is up to you.
        </p>
        <h2 style="font-size:15px;font-weight:600;color:${BRAND.ink};margin:20px 0 8px;">Get started</h2>
        <ol style="padding-left:18px;margin:0 0 12px;color:${BRAND.inkSoft};font-size:14px;line-height:1.6;">
          <li><b style="color:${BRAND.ink};">Pick a marketplace.</b> Browse public communities or use an invite code.</li>
          <li><b style="color:${BRAND.ink};">Verify an identity.</b> Most marketplaces require at least one verified social account.</li>
          <li><b style="color:${BRAND.ink};">Set up an ISO.</b> Tell us what you're hunting for; we'll ping you when it shows up.</li>
        </ol>
        ${primaryButton("Explore marketplaces", "https://shouks.com/explore")}
        ${outlineButton("Read the welcome guide", "https://shouks.com/welcome")}
        <p style="font-size:13px;line-height:1.55;color:${BRAND.muted};margin:12px 0 0;">
          Questions? Reply to this email — a real human will pick it up.
        </p>
      </td>
    </tr>
  `;
  return emailShell(inner);
}

export function applicationApprovedHtml(opts: {
  marketplace?: string;
  applicant?: string;
  ownerName?: string;
  ownerCosign?: string;
}) {
  const marketplace = opts.marketplace ?? "Ferrari Frenzy";
  const applicant = opts.applicant ?? "Jane";
  const owner = opts.ownerName ?? "Marcus Chen";
  const cosign =
    opts.ownerCosign ??
    "Read your profile top to bottom — your 308 GT4 project photos were the tiebreaker. Welcome in. Post the writeup when you're ready, people will geek out with you.";
  const inner = `
    <tr>
      <td style="padding:32px 24px 8px;">
        ${badge("You're in · " + marketplace, BRAND.successSoft, BRAND.success)}
        <h1 style="font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;margin:14px 0 8px;color:${BRAND.ink};">
          Welcome to ${marketplace}, ${applicant}.
        </h1>
        <p style="font-size:15px;line-height:1.55;color:${BRAND.inkSoft};margin:0 0 16px;">
          Your application was approved. You can now post listings, place bids, and respond to ISOs.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BRAND.line};border-radius:10px;background:${BRAND.bg};">
          <tr>
            <td style="padding:16px;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};">
                A note from the owner
              </div>
              <div style="margin-top:8px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
                &ldquo;${cosign}&rdquo;
              </div>
              <div style="margin-top:12px;font-size:12px;color:${BRAND.muted};">
                — ${owner}, founder of ${marketplace}
              </div>
            </td>
          </tr>
        </table>

        ${primaryButton("Open " + marketplace, "https://shouks.com/m/ferrari-frenzy")}
        ${outlineButton("Read the community rules", "#")}

        <h2 style="font-size:15px;font-weight:600;color:${BRAND.ink};margin:18px 0 8px;">What to do first</h2>
        <ul style="padding-left:18px;margin:0 0 8px;color:${BRAND.inkSoft};font-size:14px;line-height:1.6;">
          <li>Introduce yourself in the members thread.</li>
          <li>Set up an ISO so you never miss a match.</li>
          <li>Post your first listing — new members often sell fastest.</li>
        </ul>
      </td>
    </tr>
  `;
  return emailShell(inner);
}

export function auctionWonHtml(opts: {
  listing?: string;
  bidder?: string;
  amount?: string;
  seller?: string;
  payBy?: string;
}) {
  const listing = opts.listing ?? "1997 Ferrari F355 Spider · 6-speed";
  const bidder = opts.bidder ?? "Jane";
  const amount = opts.amount ?? "$94,000";
  const seller = opts.seller ?? "Marco C.";
  const payBy = opts.payBy ?? "Fri, Mar 28 · 7:00 PM";
  const inner = `
    <tr>
      <td style="padding:32px 24px 8px;">
        ${badge("★  Auction won · Ferrari Frenzy", BRAND.dangerSoft, BRAND.danger)}
        <h1 style="font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;margin:14px 0 8px;color:${BRAND.ink};">
          Congratulations, ${bidder} — <span style="font-style:italic;color:${BRAND.blueInk};">it's yours.</span>
        </h1>
        <p style="font-size:15px;line-height:1.55;color:${BRAND.inkSoft};margin:0 0 16px;">
          You placed the winning bid on <b style="color:${BRAND.ink};">${listing}</b>.
          Payment is due within <b style="color:${BRAND.ink};">48 hours</b> to keep your reputation score clean.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BRAND.line};border-radius:10px;overflow:hidden;margin-bottom:12px;">
          <tr>
            <td width="120" style="background:linear-gradient(135deg,#b8334d,#2a1116);padding:0;">
              <div style="height:96px;"></div>
            </td>
            <td style="padding:14px 16px;">
              <div style="font-size:14px;font-weight:600;color:${BRAND.ink};">${listing}</div>
              <div style="font-size:12px;color:${BRAND.muted};margin-top:2px;">Sold by ${seller} · Argento Nürburgring over Bordeaux</div>
              <div style="font-size:18px;font-weight:600;color:${BRAND.ink};margin-top:8px;">
                <span style="font-size:11px;color:${BRAND.muted};margin-right:4px;">USD</span>${amount}
              </div>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:13px;color:${BRAND.ink};border:1px solid ${BRAND.line};border-radius:10px;">
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid ${BRAND.line};color:${BRAND.muted};">Winning bid</td>
            <td align="right" style="padding:10px 14px;border-bottom:1px solid ${BRAND.line};">${amount}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid ${BRAND.line};color:${BRAND.muted};">Buyer's premium (2.5%)</td>
            <td align="right" style="padding:10px 14px;border-bottom:1px solid ${BRAND.line};">$2,350</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid ${BRAND.line};color:${BRAND.muted};">Pay by</td>
            <td align="right" style="padding:10px 14px;border-bottom:1px solid ${BRAND.line};">${payBy}</td>
          </tr>
          <tr>
            <td style="padding:12px 14px;font-weight:600;">Total due</td>
            <td align="right" style="padding:12px 14px;font-weight:600;">$96,350 USD</td>
          </tr>
        </table>

        ${primaryButton("Complete payment", "https://shouks.com/pay")}
        ${outlineButton("Message " + seller.split(" ")[0], "#")}

        <p style="font-size:12.5px;line-height:1.6;color:${BRAND.muted};margin:4px 0 0;">
          Shouks holds payment in escrow until you confirm the item arrived as described. If you need a
          pre-delivery inspection, <a href="#" style="color:${BRAND.blueInk};text-decoration:none;">request one</a>
          before paying — it pauses the 48-hour clock.
        </p>
      </td>
    </tr>
  `;
  return emailShell(inner);
}

export function isoMatchHtml(opts: {
  iso?: string;
  listing?: string;
  marketplace?: string;
  budget?: string;
  matchPrice?: string;
  matchSpecs?: string;
  recipient?: string;
  seller?: string;
}) {
  const iso = opts.iso ?? "1987–1991 Testarossa · Nero or Rosso Corsa";
  const listing = opts.listing ?? "1987 Testarossa · Nero";
  const marketplace = opts.marketplace ?? "Ferrari Frenzy";
  const budget = opts.budget ?? "Budget $150–200k · Nero or Rosso Corsa · <45k miles";
  const matchPrice = opts.matchPrice ?? "$184,000";
  const matchSpecs = opts.matchSpecs ?? "38,412 mi · Monospecchio · Excellent";
  const recipient = opts.recipient ?? "Jane";
  const seller = opts.seller ?? "Marco C.";

  const inner = `
    <tr>
      <td style="padding:32px 24px 8px;">
        ${badge("ISO match · " + marketplace, BRAND.purpleSoft, BRAND.purple)}
        <h1 style="font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;margin:14px 0 8px;color:${BRAND.ink};">
          ${recipient}, one of your hunts just <span style="font-style:italic;color:${BRAND.blueInk};">landed</span>.
        </h1>
        <p style="font-size:15px;line-height:1.55;color:${BRAND.inkSoft};margin:0 0 16px;">
          ${seller} posted a listing that matches your wanted ad
          <b style="color:${BRAND.ink};">&ldquo;${iso}&rdquo;</b>.
          Three other members are also watching — if you want to be first, move quickly.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:4px;">
          <tr>
            <td width="50%" valign="top" style="padding:0 6px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BRAND.line};border-radius:10px;overflow:hidden;background:${BRAND.surface};">
                <tr>
                  <td style="padding:12px 14px;">
                    <div style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};">Your ISO</div>
                    <div style="height:80px;margin:8px 0;background:${BRAND.blueSoft};border-radius:6px;"></div>
                    <div style="font-size:13px;font-weight:600;color:${BRAND.ink};">${iso.split("·")[0].trim()}</div>
                    <div style="font-size:12px;color:${BRAND.muted};line-height:1.5;margin-top:4px;">${budget}</div>
                  </td>
                </tr>
              </table>
            </td>
            <td width="50%" valign="top" style="padding:0 0 0 6px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${BRAND.line};border-radius:10px;overflow:hidden;background:${BRAND.surface};">
                <tr>
                  <td style="padding:12px 14px;">
                    <div style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};">The match</div>
                    <div style="height:80px;margin:8px 0;background:linear-gradient(135deg,#b8334d,#2a1116);border-radius:6px;"></div>
                    <div style="font-size:13px;font-weight:600;color:${BRAND.ink};">${listing}</div>
                    <div style="font-size:12px;color:${BRAND.muted};line-height:1.5;margin-top:4px;">${matchPrice} · ${matchSpecs}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${primaryButton("View listing", "https://shouks.com/l/match")}
        ${outlineButton("Message " + seller.split(" ")[0], "#")}

        <p style="font-size:12.5px;line-height:1.6;color:${BRAND.muted};margin:4px 0 0;">
          Not quite right?
          <a href="#" style="color:${BRAND.blueInk};text-decoration:none;">Adjust your ISO</a>
          to sharpen future matches, or
          <a href="#" style="color:${BRAND.blueInk};text-decoration:none;">pause it</a>
          if you've filled the hunt.
        </p>
      </td>
    </tr>
  `;
  return emailShell(inner);
}
