import { requireOwnerOf } from "@/lib/auth-helpers";
import { ActivityDashboard } from "./ActivityDashboard";

export default async function ActivitySettingsPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  await requireOwnerOf(params.slug);
  return <ActivityDashboard slug={params.slug} />;
}
