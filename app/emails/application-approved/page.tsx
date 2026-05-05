import { EmailPreview } from "../EmailFrame";
import { applicationApprovedHtml } from "../emailHtml";
import { i18n } from '@shipeasy/sdk/client'

export const dynamic = "force-dynamic";

export default async function ApplicationApprovedPreview(
  props: {
    searchParams: Promise<{
      marketplace?: string;
      applicant?: string;
      owner?: string;
      cosign?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const marketplace = searchParams.marketplace ?? i18n.t('common.ferrariFrenzy');
  const applicant = searchParams.applicant ?? i18n.t('common.jane');
  const ownerName = searchParams.owner ?? i18n.t('common.marcusChen');
  const ownerCosign = searchParams.cosign;

  const html = applicationApprovedHtml({ marketplace, applicant, ownerName, ownerCosign });
  return (
    <EmailPreview
      title={i18n.t('...applicationApproved.page.applicationApproved')}
      subject={`You're in — welcome to ${marketplace}`}
      html={html}
    />
  );
}
