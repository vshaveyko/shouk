import { redirect } from "next/navigation";

export default function SettingsIndex({ params }: { params: { slug: string } }) {
  redirect(`/owner/${params.slug}/settings/identity`);
}
