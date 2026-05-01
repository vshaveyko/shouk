import { EmailPreview } from "../EmailFrame";
import { welcomeEmailHtml } from "../emailHtml";

export const dynamic = "force-dynamic";

export default async function WelcomeEmailPreview(
  props: {
    searchParams: Promise<{ name?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const name = searchParams.name ?? "Jane";
  const html = welcomeEmailHtml({ name });
  return (
    <EmailPreview
      title="Welcome email"
      subject={`Welcome to Shouks, ${name}`}
      html={html}
    />
  );
}
