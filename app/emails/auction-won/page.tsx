import { EmailPreview } from "../EmailFrame";
import { auctionWonHtml } from "../emailHtml";

export const dynamic = "force-dynamic";

export default function AuctionWonPreview({
  searchParams,
}: {
  searchParams: {
    listing?: string;
    bidder?: string;
    amount?: string;
    seller?: string;
    payBy?: string;
  };
}) {
  const listing = searchParams.listing ?? "1997 Ferrari F355 Spider · 6-speed";
  const bidder = searchParams.bidder ?? "Jane";
  const amount = searchParams.amount ?? "$94,000";
  const seller = searchParams.seller ?? "Marco C.";
  const payBy = searchParams.payBy ?? "Fri, Mar 28 · 7:00 PM";

  const html = auctionWonHtml({ listing, bidder, amount, seller, payBy });
  return (
    <EmailPreview
      title="Auction won"
      subject={`You won: ${listing} · ${amount}`}
      html={html}
    />
  );
}
