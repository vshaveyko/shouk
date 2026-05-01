import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { RulesForm } from "./RulesForm";

export default async function RulesSettingsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  await requireOwnerOf(params.slug);
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: {
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
    <RulesForm
      slug={params.slug}
      initial={{
        entryMethod: mp.entryMethod,
        requiredVerifications: mp.requiredVerifications,
        autoApprove: mp.autoApprove,
        questions,
      }}
    />
  );
}
