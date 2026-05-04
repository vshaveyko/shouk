"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

// SHK-053: thin client toggle that flips a marketplace favorite via
// /api/marketplaces/[slug]/favorite and refreshes the server tree so
// the dropdown ordering / Favorites filter pick the change up.
export function FavoriteToggle({
  slug,
  initialFavorited,
  className,
}: {
  slug: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = React.useState(initialFavorited);
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const next = !favorited;
    setFavorited(next);
    try {
      const res = await fetch(`/api/marketplaces/${slug}/favorite`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setFavorited(!next);
        return;
      }
      router.refresh();
    } catch {
      setFavorited(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      data-testid="favorite-toggle"
      className={className}
    >
      <Star size={14} fill={favorited ? "currentColor" : "none"} />
      {favorited ? "Favorited" : "Favorite"}
    </button>
  );
}
