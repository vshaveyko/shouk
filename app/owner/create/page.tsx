import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { CreateMarketplaceWizard } from "./CreateMarketplaceWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create a marketplace",
};

export default async function CreateMarketplacePage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/owner/create");
  const { user, memberships, owned } = ctx;

  return (
    <div className="min-h-screen bg-bg-soft flex flex-col">
      <Navbar
        user={{
          id: user.id,
          name: user.displayName ?? user.name,
          image: user.image,
          email: user.email,
        }}
        activeMarketplace={null}
        marketplaces={[...owned, ...memberships]}
        mode={user.defaultRole === "OWNER" ? "owner" : "member"}
      />
      <CreateMarketplaceWizard />
    </div>
  );
}
