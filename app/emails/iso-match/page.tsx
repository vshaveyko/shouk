import { EmailPreview } from "../EmailFrame";
import { isoMatchHtml } from "../emailHtml";

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
  const iso = searchParams.iso ?? "1987–1991 Testarossa · Nero or Rosso Corsa";
  const listing = searchParams.listing ?? "1987 Testarossa · Nero";
  const marketplace = searchParams.marketplace ?? "Ferrari Frenzy";
  const budget = searchParams.budget ?? "Budget $150–200k · Nero or Rosso Corsa · <45k miles";
  const matchPrice = searchParams.price ?? "$184,000";
  const matchSpecs = searchParams.specs ?? "38,412 mi · Monospecchio · Excellent";
  const recipient = searchParams.recipient ?? "Jane";
  const seller = searchParams.seller ?? "Marco C.";

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
      title="ISO match"
      subject={`Match found: ${listing} on ${marketplace}`}
      html={html}
    />
  );
}
