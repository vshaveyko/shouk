import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { MembersTable, type MemberRow } from "./MembersTable";

export const dynamic = "force-dynamic";

const membersCss = `
.mem-body { padding: 28px 32px; min-width: 0; }
.mem-body .page-head { margin-bottom: 22px; }
.mem-body .page-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; line-height: 1.05; letter-spacing: -0.01em; }
.mem-body .page-head .lead { font-size: 13px; color: var(--muted); margin-top: 6px; max-width: 560px; }

.mem-body .members-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
.mem-body .members-filters { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.mem-body .filter-chip { padding: 5px 11px; border-radius: 7px; font-size: 12px; font-weight: 500; color: var(--ink-soft); background: #fff; border: 1px solid var(--line); display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; cursor: pointer; }
.mem-body .filter-chip:hover { background: var(--hover); }
.mem-body .filter-chip svg { width: 11px; height: 11px; color: var(--muted); }
.mem-body .search-field { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 7px; background: #fff; border: 1px solid var(--line); min-width: 220px; }
.mem-body .search-field svg { width: 12px; height: 12px; color: var(--muted); }
.mem-body .search-field input { border: 0; outline: 0; flex: 1; font-size: 12px; background: transparent; color: var(--ink); }
.mem-body .search-field input::placeholder { color: var(--muted); }

.mem-body .m-table { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.mem-body .m-thead { display: grid; grid-template-columns: 36px 2.6fr 1.1fr 1fr 1fr 1fr 80px; padding: 10px 16px; background: var(--bg-soft); border-bottom: 1px solid var(--line); font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; align-items: center; gap: 12px; }
.mem-body .m-thead input[type="checkbox"] { width: 14px; height: 14px; accent-color: var(--blue); }

.mem-body .m-row { display: grid; grid-template-columns: 36px 2.6fr 1.1fr 1fr 1fr 1fr 80px; padding: 12px 16px; border-bottom: 1px solid var(--line-soft); align-items: center; transition: background 0.12s; gap: 12px; }
.mem-body .m-row:last-child { border-bottom: 0; }
.mem-body .m-row:hover { background: var(--bg-soft); }
.mem-body .m-row input[type="checkbox"] { width: 14px; height: 14px; accent-color: var(--blue); }

.mem-body .m-member { display: flex; align-items: center; gap: 10px; min-width: 0; }
.mem-body .m-member .av { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 12px; font-weight: 600; flex: none; overflow: hidden; }
.mem-body .m-member .av img { width: 100%; height: 100%; object-fit: cover; }
.mem-body .m-member > div:last-child { min-width: 0; flex: 1; }
.mem-body .m-member .m-name { font-size: 13px; font-weight: 600; letter-spacing: -0.005em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mem-body .m-member .m-email { font-size: 11.5px; color: var(--muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mem-body .m-role { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 500; padding: 3px 9px; border-radius: 4px; background: var(--bg-soft); color: var(--ink-soft); white-space: nowrap; }
.mem-body .m-role.owner { background: var(--ink); color: #fff; }
.mem-body .m-role.admin { background: var(--blue-softer); color: var(--blue-ink); border: 1px solid var(--blue-soft); }
.mem-body .m-role.moderator { background: var(--blue-soft); color: var(--blue-ink); }
.mem-body .m-role.suspended { background: var(--danger-soft); color: var(--danger); }

.mem-body .m-num { font-variant-numeric: tabular-nums; font-size: 13px; }
.mem-body .m-num.muted { color: var(--muted); }

.mem-body .m-actions { display: flex; gap: 4px; justify-content: flex-end; }
.mem-body .m-actions .icon-btn { width: 26px; height: 26px; border-radius: 6px; display: grid; place-items: center; color: var(--muted); background: transparent; border: 0; cursor: pointer; }
.mem-body .m-actions .icon-btn:hover { background: var(--hover); color: var(--ink); }
.mem-body .m-actions .icon-btn svg { width: 13px; height: 13px; }

.mem-body .empty-state { padding: 60px 24px; text-align: center; color: var(--muted); font-size: 13px; }
`;

export default async function MembersDirectoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { marketplace } = await requireOwnerOf(params.slug);

  const memberships = await prisma.membership.findMany({
    where: { marketplaceId: marketplace.id },
    orderBy: { joinedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  const counts = await prisma.listing.groupBy({
    by: ["sellerId"],
    where: { marketplaceId: marketplace.id, status: "ACTIVE" },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.sellerId, c._count._all]));

  const rows: MemberRow[] = memberships.map((m) => ({
    userId: m.userId,
    displayName: m.user.displayName ?? m.user.name ?? m.user.email ?? "Member",
    email: m.user.email,
    image: m.user.image,
    joinedAt: m.joinedAt.toISOString(),
    role: m.role,
    status: m.status,
    activeListings: countMap.get(m.userId) ?? 0,
  }));

  return (
    <OwnerShell slug={params.slug}>
      <style dangerouslySetInnerHTML={{ __html: membersCss }} />
      <main className="mem-body">
        <div className="page-head">
          <h1>Members</h1>
          <div className="lead">
            {rows.length} member{rows.length === 1 ? "" : "s"} in {marketplace.name}.
            Filter, sort, and change roles. Bulk actions run on selected rows.
          </div>
        </div>

        <MembersTable slug={params.slug} rows={rows} />
      </main>
    </OwnerShell>
  );
}
