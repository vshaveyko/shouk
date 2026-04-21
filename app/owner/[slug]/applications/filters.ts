import { Prisma, type ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type QueueStatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";
export type VerifFilter = "all" | "full" | "partial" | "none";
export type SortFilter = "oldest" | "newest";

export type QueueFilters = {
  status: QueueStatusFilter;
  q: string;
  verif: VerifFilter;
  sort: SortFilter;
};

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
const VERIFS = ["all", "full", "partial", "none"] as const;
const SORTS = ["oldest", "newest"] as const;

function pick<T extends string>(
  val: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = Array.isArray(val) ? val[0] : val;
  return (allowed as readonly string[]).includes(raw ?? "")
    ? (raw as T)
    : fallback;
}

export function parseQueueFilters(
  sp: Record<string, string | string[] | undefined> | undefined,
): QueueFilters {
  const s = sp ?? {};
  const rawQ = Array.isArray(s.q) ? s.q[0] : s.q;
  return {
    status: pick(s.status, STATUSES, "PENDING"),
    q: (rawQ ?? "").trim(),
    verif: pick(s.verif, VERIFS, "all"),
    sort: pick(s.sort, SORTS, "oldest"),
  };
}

export function serializeFilters(filters: QueueFilters): string {
  const params = new URLSearchParams();
  if (filters.status !== "PENDING") params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  if (filters.verif !== "all") params.set("verif", filters.verif);
  if (filters.sort !== "oldest") params.set("sort", filters.sort);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function buildWhere(
  marketplaceId: string,
  filters: QueueFilters,
): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = { marketplaceId };
  if (filters.status !== "ALL") {
    where.status = filters.status as ApplicationStatus;
  }
  return where;
}

export function orderByForSort(sort: SortFilter): Prisma.ApplicationOrderByWithRelationInput {
  return { createdAt: sort === "newest" ? "desc" : "asc" };
}

type FilterableApp = {
  answers: Prisma.JsonValue;
  user: {
    displayName: string | null;
    name: string | null;
    email: string | null;
    verifiedAccounts: { provider: string }[];
  };
};

export function applyInMemoryFilters<T extends FilterableApp>(
  apps: T[],
  filters: QueueFilters,
  requiredVerifications: string[],
): T[] {
  const q = filters.q.toLowerCase();
  const required = requiredVerifications.filter(Boolean);
  return apps.filter((a) => {
    if (q) {
      const hay = [
        a.user.displayName,
        a.user.name,
        a.user.email,
        JSON.stringify(a.answers),
      ]
        .filter((x): x is string => typeof x === "string" && x.length > 0)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.verif !== "all" && required.length > 0) {
      const verified = new Set(a.user.verifiedAccounts.map((v) => v.provider));
      const hits = required.filter((r) => verified.has(r)).length;
      const hasAll = hits === required.length;
      if (filters.verif === "full" && !hasAll) return false;
      if (filters.verif === "partial" && (hasAll || hits === 0)) return false;
      if (filters.verif === "none" && hits > 0) return false;
    }
    return true;
  });
}

export async function fetchQueueCounts(marketplaceId: string) {
  const [pending, approved, rejected, all] = await Promise.all([
    prisma.application.count({ where: { marketplaceId, status: "PENDING" } }),
    prisma.application.count({ where: { marketplaceId, status: "APPROVED" } }),
    prisma.application.count({ where: { marketplaceId, status: "REJECTED" } }),
    prisma.application.count({ where: { marketplaceId } }),
  ]);
  return { pending, approved, rejected, all };
}
