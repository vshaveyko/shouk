import { EmailPreview } from "../EmailFrame";
import { auctionWonHtml } from "../emailHtml";
import { i18n } from '@shipeasy/sdk/client'

export const dynamic = "force-dynamic";

export default async function AuctionWonPreview(
  props: {
    searchParams: Promise<{
      listing?: string;
      bidder?: string;
      amount?: string;
      seller?: string;
      payBy?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const listing = searchParams.listing ?? i18n.t('common.1997FerrariF355Spider6speed');
  const bidder = searchParams.bidder ?? i18n.t('common.jane');
  const amount = searchParams.amount ?? "$94,000";
  const seller = searchParams.seller ?? i18n.t('common.marcoC');
  const payBy = searchParams.payBy ?? i18n.t('common.friMar28700Pm');

  const html = auctionWonHtml({ listing, bidder, amount, seller, payBy });
  return (
    <EmailPreview
      title={i18n.t('...auctionWon.page.auctionWon')}
      subject={`You won: ${listing} · ${amount}`}
      html={html}
    />
  );
}
