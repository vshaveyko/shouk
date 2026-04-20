import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// Messages live under a marketplace. This route just routes the user to the
// right marketplace's inbox — either the first one they own, or the first
// they're a member of. If they have neither, send them to /home.
export default async function MessagesRedirect() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/messages");
  const first = ctx.owned[0] ?? ctx.memberships[0];
  if (!first) redirect("/home");
  redirect(`/m/${first.slug}/messages`);
}
