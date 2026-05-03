import { redirect } from "next/navigation";

// SHK-057: Saved listings live as a tab inside Dashboard (/activity).
// Keep /saved as a redirect so existing bookmarks/links don't 404.
export default function SavedRedirect() {
  redirect("/activity?tab=saved");
}
