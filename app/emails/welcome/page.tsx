import { EmailPreview } from "../EmailFrame";
import { welcomeEmailHtml } from "../emailHtml";

export const dynamic = "force-dynamic";

export default function WelcomeEmailPreview({
  searchParams,
}: {
  searchParams: { name?: string };
}) {
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
