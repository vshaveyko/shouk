import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { IdentityForm } from "./IdentityForm";
import { RulesForm } from "../rules/RulesForm";

export default async function IdentitySettingsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  await requireOwnerOf(params.slug);
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      slug: true,
      tagline: true,
      description: true,
      coverImageUrl: true,
      primaryColor: true,
      status: true,
      entryMethod: true,
      requiredVerifications: true,
      autoApprove: true,
      applicationQuestions: { orderBy: { order: "asc" } },
    },
  });
  if (!mp) return null;

  const questions = mp.applicationQuestions.map((q) => ({
    id: q.id,
    order: q.order,
    label: q.label,
    helpText: q.helpText ?? "",
    type: q.type,
    required: q.required,
    options: Array.isArray(q.options) ? (q.options as unknown as string[]) : [],
  }));

  return (
    <div className="space-y-8">
      <IdentityForm slug={params.slug} initial={mp} />
      <RulesForm
        slug={params.slug}
        initial={{
          entryMethod: mp.entryMethod,
          requiredVerifications: mp.requiredVerifications,
          autoApprove: mp.autoApprove,
          questions,
        }}
      />
    </div>
  );
}
