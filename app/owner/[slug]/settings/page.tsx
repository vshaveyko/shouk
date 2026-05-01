import { redirect } from "next/navigation";

export default async function SettingsIndex(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  redirect(`/owner/${params.slug}/settings/identity`);
}
