import { requireOwnerOf } from "@/lib/auth-helpers";
import { ActivityDashboard } from "./ActivityDashboard";

export default async function ActivitySettingsPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireOwnerOf(params.slug);
  return <ActivityDashboard slug={params.slug} />;
}
