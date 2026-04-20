import { EmailPreview } from "../EmailFrame";
import { applicationApprovedHtml } from "../emailHtml";

export const dynamic = "force-dynamic";

export default function ApplicationApprovedPreview({
  searchParams,
}: {
  searchParams: {
    marketplace?: string;
    applicant?: string;
    owner?: string;
    cosign?: string;
  };
}) {
  const marketplace = searchParams.marketplace ?? "Ferrari Frenzy";
  const applicant = searchParams.applicant ?? "Jane";
  const ownerName = searchParams.owner ?? "Marcus Chen";
  const ownerCosign = searchParams.cosign;

  const html = applicationApprovedHtml({ marketplace, applicant, ownerName, ownerCosign });
  return (
    <EmailPreview
      title="Application approved"
      subject={`You're in — welcome to ${marketplace}`}
      html={html}
    />
  );
}
