import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SchemaEditor } from "./SchemaEditor";

export default async function SchemaSettingsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  await requireOwnerOf(params.slug);
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: {
      schemaFields: { orderBy: { order: "asc" } },
    },
  });
  if (!mp) return null;

  const fields = mp.schemaFields.map((f) => ({
    id: f.id,
    order: f.order,
    name: f.name,
    label: f.label,
    helpText: f.helpText ?? "",
    type: f.type,
    required: f.required,
    options: Array.isArray(f.options) ? (f.options as unknown as string[]) : [],
    minImages: f.minImages ?? null,
    maxImages: f.maxImages ?? null,
    archived: f.archived,
  }));

  return <SchemaEditor slug={params.slug} initial={fields} />;
}
