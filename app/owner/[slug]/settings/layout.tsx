import { redirect } from "next/navigation";
import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { SettingsTabs } from "@/components/owner/SettingsTabs";
import { i18n } from '@shipeasy/sdk/client'

export const dynamic = "force-dynamic";

export const metadata = { title: i18n.t('common.settings') };

export default async function OwnerSettingsLayout(
  props: {
    params: Promise<{ slug: string }>;
    children: React.ReactNode;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  await requireOwnerOf(params.slug);

  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
    },
  });
  if (!mp) redirect("/home");

  return (
    <OwnerShell slug={params.slug}>
      <main className="flex-1">
        <div className="max-w-[1180px] mx-auto px-8 pt-8 pb-24 w-full">
          <header className="mb-6">
            <h1 className="serif text-[34px] leading-[1.05] tracking-[-0.01em]" style={{ fontWeight: 400 }}>
              {mp.name} <em className="italic text-blue-ink">{i18n.t('...settings.layout.settings')}</em>
            </h1>
            <p className="text-[13px] text-muted mt-1.5 max-w-[560px]">
              {i18n.t('...settings.layout.identitySchemaRulesAndMore')}
            </p>
          </header>

          <SettingsTabs slug={params.slug} />

          <div className="mt-6">{children}</div>
        </div>
      </main>
    </OwnerShell>
  );
}
