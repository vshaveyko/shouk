import { EmailPreview } from "../EmailFrame";
import { isoMatchHtml } from "../emailHtml";
import { i18n } from '@shipeasy/sdk/client'

export const dynamic = "force-dynamic";

export default async function IsoMatchPreview(
  props: {
    searchParams: Promise<{
      iso?: string;
      listing?: string;
      marketplace?: string;
      budget?: string;
      price?: string;
      specs?: string;
      recipient?: string;
      seller?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const iso = searchParams.iso ?? i18n.t('common.19871991TestarossaNeroOrRosso');
  const listing = searchParams.listing ?? i18n.t('common.1987TestarossaNero');
  const marketplace = searchParams.marketplace ?? i18n.t('common.ferrariFrenzy');
  const budget = searchParams.budget ?? i18n.t('common.budget150200kNeroOrRosso');
  const matchPrice = searchParams.price ?? "$184,000";
  const matchSpecs = searchParams.specs ?? i18n.t('common.38412MiMonospecchioExcellent');
  const recipient = searchParams.recipient ?? i18n.t('common.jane');
  const seller = searchParams.seller ?? i18n.t('common.marcoC');

  const html = isoMatchHtml({
    iso,
    listing,
    marketplace,
    budget,
    matchPrice,
    matchSpecs,
    recipient,
    seller,
  });
  return (
    <EmailPreview
      title={i18n.t('...isoMatch.page.isoMatch')}
      subject={`Match found: ${listing} on ${marketplace}`}
      html={html}
    />
  );
}
