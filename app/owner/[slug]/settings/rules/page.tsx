import { redirect } from "next/navigation";

// SHK-046: rules tab folded into Identity. Redirect any direct hits to the
// identity page so external links/bookmarks don't 404.
export default async function RulesSettingsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  redirect(`/owner/${params.slug}/settings/identity`);
}
