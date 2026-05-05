import { EmailPreview } from "../EmailFrame";
import { welcomeEmailHtml } from "../emailHtml";
import { i18n } from '@shipeasy/sdk/client'

export const dynamic = "force-dynamic";

export default async function WelcomeEmailPreview(
  props: {
    searchParams: Promise<{ name?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const name = searchParams.name ?? i18n.t('common.jane');
  const html = welcomeEmailHtml({ name });
  return (
    <EmailPreview
      title={i18n.t('...welcome.page.welcomeEmail')}
      subject={`Welcome to Shouks, ${name}`}
      html={html}
    />
  );
}
