"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MoreHorizontal,
  Search,
  ArrowUpDown,
  ShieldCheck,
  Shield,
  UserMinus,
  UserX,
  Ban,
  ArrowDownToLine,
  RotateCcw,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/Dialog";
import { timeAgo } from "@/lib/utils";
import { i18n } from '@shipeasy/sdk/client'

export type MemberRow = {
  userId: string;
  displayName: string;
  email: string | null;
  image: string | null;
  joinedAt: string;
  role: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  activeListings: number;
};

type SortKey = "name" | "joined" | "listings";
type SortDir = "asc" | "desc";

type ActionKey =
  | "PROMOTE_ADMIN"
  | "PROMOTE_MOD"
  | "DEMOTE"
  | "SUSPEND"
  | "BAN"
  | "REINSTATE"
  | "REMOVE";

const SUSPEND_OPTIONS = [
  { label: i18n.t('common.7Days'), days: 7 },
  { label: i18n.t('common.nDays', { n1: 30 }), days: 30 },
  { label: i18n.t('common.nDays', { n1: 90 }), days: 90 },
  { label: i18n.t('...members.membersTable.indefinite'), days: 0 },
];

export function MembersTable({ slug, rows }: { slug: string; rows: MemberRow[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("joined");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const [target, setTarget] = React.useState<MemberRow | null>(null);
  const [action, setAction] = React.useState<ActionKey | null>(null);
  const [reason, setReason] = React.useState("");
  const [suspendDays, setSuspendDays] = React.useState<number>(7);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    let list = rows;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.displayName.toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q),
      );
    }
    if (roleFilter !== "all") list = list.filter((r) => r.role === roleFilter);
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);

    return [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return a.displayName.localeCompare(b.displayName) * dir;
      if (sortKey === "listings") return (a.activeListings - b.activeListings) * dir;
      return (new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()) * dir;
    });
  }, [rows, search, roleFilter, statusFilter, sortKey, sortDir]);

  function changeSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function startAction(row: MemberRow, act: ActionKey) {
    setTarget(row);
    setAction(act);
    setReason("");
    setSuspendDays(7);
  }

  async function confirm() {
    if (!target || !action) return;
    const payload: Record<string, unknown> = {
      userId: target.userId,
      action,
    };
    if (action === "SUSPEND") {
      if (suspendDays > 0) {
        payload.until = new Date(Date.now() + suspendDays * 86400000).toISOString();
      }
      if (reason) payload.reason = reason;
    } else if (action === "BAN") {
      if (reason) payload.reason = reason;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/marketplaces/${slug}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        alert((await res.json().catch(() => null))?.error ?? i18n.t('common.failed'));
        return;
      }
      setAction(null);
      setTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const needsDialog =
    action === "SUSPEND" ||
    action === "BAN" ||
    action === "REMOVE" ||
    action === "PROMOTE_ADMIN" ||
    action === "PROMOTE_MOD" ||
    action === "DEMOTE" ||
    action === "REINSTATE";

  const avatarGradients = [
    "linear-gradient(135deg, oklch(0.65 0.15 260), oklch(0.45 0.12 260))",
    "linear-gradient(135deg, oklch(0.62 0.16 30),  oklch(0.42 0.13 30))",
    "linear-gradient(135deg, oklch(0.55 0.14 155), oklch(0.35 0.10 155))",
    "linear-gradient(135deg, oklch(0.58 0.13 80),  oklch(0.38 0.10 80))",
    "linear-gradient(135deg, oklch(0.60 0.14 320), oklch(0.40 0.11 320))",
  ];
  function initialsOf(n: string) {
    const p = n.trim().split(/\s+/);
    return (p[0]?.[0] ?? "") + (p[1]?.[0] ?? "");
  }

  return (
    <>
      {/* Filters row — design pattern */}
      <div className="members-head">
        <div className="search-field" style={{ flex: "1", maxWidth: 340 }}>
          <Search size={12} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={i18n.t('...members.membersTable.searchNameOrEmailPlaceholder')}
            data-testid="members-search"
          />
        </div>
        <div className="members-filters">
          <div style={{ width: 150 }}>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={i18n.t('common.role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{i18n.t('...members.membersTable.allRoles')}</SelectItem>
                <SelectItem value="OWNER">{i18n.t('common.owner')}</SelectItem>
                <SelectItem value="ADMIN">{i18n.t('common.admin')}</SelectItem>
                <SelectItem value="MODERATOR">{i18n.t('common.moderator')}</SelectItem>
                <SelectItem value="MEMBER">{i18n.t('common.member')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div style={{ width: 150 }}>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={i18n.t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{i18n.t('...members.membersTable.allStatuses')}</SelectItem>
                <SelectItem value="ACTIVE">{i18n.t('common.active')}</SelectItem>
                <SelectItem value="SUSPENDED">{i18n.t('...members.membersTable.suspended')}</SelectItem>
                <SelectItem value="BANNED">{i18n.t('...members.membersTable.banned')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button type="button" className="filter-chip" onClick={() => changeSort("joined")}>
            {i18n.t('...members.membersTable.sort')} {sortKey === "joined" ? i18n.t('common.joined') : sortKey === "name" ? i18n.t('common.name') : i18n.t('common.listings')}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="m-table" data-testid="members-table">
        <div className="m-thead">
          <input type="checkbox" aria-label={i18n.t('common.selectAll')} />
          <span>{i18n.t('common.member')}</span>
          <span>{i18n.t('common.joined')}</span>
          <span>{i18n.t('common.listings')}</span>
          <span>{i18n.t('common.role')}</span>
          <span>{i18n.t('common.status')}</span>
          <span />
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">{i18n.t('...members.membersTable.noMembersMatchYourFilters')}</div>
        ) : (
          filtered.map((r, i) => {
            const grad = avatarGradients[i % avatarGradients.length];
            return (
              <div
                key={r.userId}
                className="m-row"
                data-testid={`member-row-${r.userId}`}
              >
                <input type="checkbox" aria-label={i18n.t('...members.membersTable.selectDisplayname', { displayName: String(r.displayName) })} />
                <div className="m-member">
                  <div className="av" style={{ background: grad }}>
                    {r.image ? <img src={r.image} alt="" /> : initialsOf(r.displayName)}
                  </div>
                  <div>
                    <div className="m-name">{r.displayName}</div>
                    {r.email && <div className="m-email">{r.email}</div>}
                  </div>
                </div>
                <div className="m-num muted">{timeAgo(r.joinedAt)}</div>
                <div className="m-num">{r.activeListings}</div>
                <div>
                  <RoleChip role={r.role} />
                </div>
                <div>
                  <StatusChip status={r.status} />
                </div>
                <div className="m-actions">
                  {r.role !== "OWNER" ? (
                    <RowMenu row={r} onAction={startAction} />
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog
        open={needsDialog && target !== null}
        onOpenChange={(o) => {
          if (!o) {
            setAction(null);
            setTarget(null);
          }
        }}
      >
        <DialogContent width={460}>
          <DialogHeader>
            <DialogTitle>{actionTitle(action, target)}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {target && (
              <div className="flex items-center gap-3 bg-bg-soft rounded-[10px] p-3">
                <Avatar src={target.image} name={target.displayName} size={32} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">
                    {target.displayName}
                  </div>
                  {target.email && (
                    <div className="text-[11px] text-muted truncate">{target.email}</div>
                  )}
                </div>
              </div>
            )}

            {action === "SUSPEND" && (
              <div>
                <label className="text-[12px] text-ink-soft block mb-1.5 font-medium">
                  {i18n.t('common.duration')}
                </label>
                <Select
                  value={String(suspendDays)}
                  onValueChange={(v) => setSuspendDays(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUSPEND_OPTIONS.map((o) => (
                      <SelectItem key={o.label} value={String(o.days)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(action === "SUSPEND" || action === "BAN") && (
              <div>
                <label className="text-[12px] text-ink-soft block mb-1.5 font-medium">
                  {i18n.t('common.reason')}{action === "BAN" ? "" : i18n.t('common.optional2')}
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    action === "BAN"
                      ? i18n.t('...members.membersTable.whyIsThisMemberBeing')
                      : i18n.t('...members.membersTable.optionalContext')
                  }
                  data-testid="member-reason"
                />
              </div>
            )}

            {action === "REMOVE" && (
              <p className="text-[13px] text-ink-soft">
                {i18n.t('...members.membersTable.thisRemovesTheMembershipThe')}
              </p>
            )}

            {(action === "PROMOTE_ADMIN" ||
              action === "PROMOTE_MOD" ||
              action === "DEMOTE" ||
              action === "REINSTATE") && (
              <p className="text-[13px] text-ink-soft">
                {action === "PROMOTE_ADMIN" &&
                  i18n.t('...members.membersTable.adminsCanInviteApproveApplications')}
                {action === "PROMOTE_MOD" &&
                  i18n.t('...members.membersTable.moderatorsCanReviewApplicationsAnd')}
                {action === "DEMOTE" && i18n.t('...members.membersTable.thisRoleWillBeReset')}
                {action === "REINSTATE" &&
                  i18n.t('...members.membersTable.clearsAnySuspensionOrBan')}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setAction(null);
                setTarget(null);
              }}
              disabled={busy}
            >
              {i18n.t('common.cancel')}
            </Button>
            <Button
              variant={action === "BAN" || action === "REMOVE" ? "danger" : "primary"}
              onClick={confirm}
              disabled={busy || (action === "BAN" && !reason)}
              data-testid="member-confirm"
            >
              {busy ? i18n.t('common.working') : actionButton(action)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoleChip({ role }: { role: MemberRow["role"] }) {
  if (role === "OWNER") return <span className="m-role owner">{i18n.t('common.owner')}</span>;
  if (role === "ADMIN") return <span className="m-role admin">{i18n.t('common.admin')}</span>;
  if (role === "MODERATOR") return <span className="m-role moderator">{i18n.t('common.moderator')}</span>;
  return <span className="m-role">{i18n.t('common.member')}</span>;
}

function StatusChip({ status }: { status: MemberRow["status"] }) {
  if (status === "ACTIVE")
    return (
      <span className="m-role" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
        {i18n.t('common.active')}
      </span>
    );
  if (status === "SUSPENDED")
    return (
      <span className="m-role" style={{ background: "var(--warn-soft)", color: "oklch(0.48 0.15 50)" }}>
        {i18n.t('...members.membersTable.suspended')}
      </span>
    );
  return (
    <span className="m-role suspended">{i18n.t('...members.membersTable.banned')}</span>
  );
}

function Th({
  children,
  onClick,
  active,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <th className={("px-4 py-2.5 font-medium ") + (className ?? "")}>
      <button
        type="button"
        onClick={onClick}
        className={
          "inline-flex items-center gap-1.5 hover:text-ink transition " +
          (active ? "text-ink" : "")
        }
      >
        {children}
        <ArrowUpDown size={11} className="opacity-60" />
      </button>
    </th>
  );
}

function RoleBadge({ role }: { role: MemberRow["role"] }) {
  if (role === "OWNER") return <Badge variant="blue">{i18n.t('common.owner')}</Badge>;
  if (role === "ADMIN") return <Badge variant="blue">{i18n.t('common.admin')}</Badge>;
  if (role === "MODERATOR") return <Badge variant="neutral">{i18n.t('common.moderator')}</Badge>;
  return <Badge variant="outline">{i18n.t('common.member')}</Badge>;
}

function StatusPill({ status }: { status: MemberRow["status"] }) {
  if (status === "ACTIVE") return <Badge variant="approved">{i18n.t('common.active')}</Badge>;
  if (status === "SUSPENDED") return <Badge variant="pending">{i18n.t('...members.membersTable.suspended')}</Badge>;
  return <Badge variant="rejected">{i18n.t('...members.membersTable.banned')}</Badge>;
}

function RowMenu({
  row,
  onAction,
}: {
  row: MemberRow;
  onAction: (row: MemberRow, a: ActionKey) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="icon-btn" aria-label={i18n.t('...members.membersTable.memberActionsAria-label')}>
          <MoreHorizontal size={13} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="min-w-[200px] p-1.5 bg-surface border border-line rounded-[10px] shadow-lg z-50"
        >
          {row.role !== "ADMIN" && row.status !== "BANNED" && (
            <Item
              icon={<ShieldCheck size={14} />}
              onSelect={() => onAction(row, "PROMOTE_ADMIN")}
              testid="member-action-PROMOTE_ADMIN"
            >
              {i18n.t('...members.membersTable.promoteToAdmin')}
            </Item>
          )}
          {row.role !== "MODERATOR" && row.role !== "ADMIN" && row.status !== "BANNED" && (
            <Item
              icon={<Shield size={14} />}
              onSelect={() => onAction(row, "PROMOTE_MOD")}
              testid="member-action-PROMOTE_MOD"
            >
              {i18n.t('...members.membersTable.promoteToModerator')}
            </Item>
          )}
          {(row.role === "ADMIN" || row.role === "MODERATOR") && (
            <Item
              icon={<ArrowDownToLine size={14} />}
              onSelect={() => onAction(row, "DEMOTE")}
              testid="member-action-DEMOTE"
            >
              {i18n.t('...members.membersTable.demoteToMember')}
            </Item>
          )}
          <DropdownMenu.Separator className="h-px bg-line-soft my-1" />
          {row.status === "ACTIVE" ? (
            <>
              <Item
                icon={<UserX size={14} />}
                onSelect={() => onAction(row, "SUSPEND")}
                testid="member-action-SUSPEND"
              >
                {i18n.t('...members.membersTable.suspend')}
              </Item>
              <Item
                icon={<Ban size={14} />}
                onSelect={() => onAction(row, "BAN")}
                danger
                testid="member-action-BAN"
              >
                {i18n.t('...members.membersTable.ban')}
              </Item>
            </>
          ) : (
            <Item
              icon={<RotateCcw size={14} />}
              onSelect={() => onAction(row, "REINSTATE")}
              testid="member-action-REINSTATE"
            >
              {i18n.t('...members.membersTable.reinstate')}
            </Item>
          )}
          <Item
            icon={<UserMinus size={14} />}
            onSelect={() => onAction(row, "REMOVE")}
            danger
            testid="member-action-REMOVE"
          >
            {i18n.t('...members.membersTable.removeFromMarketplace')}
          </Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Item({
  icon,
  children,
  onSelect,
  danger,
  testid,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  testid?: string;
}) {
  return (
    <DropdownMenu.Item
      onSelect={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className={
        "flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[13px] cursor-pointer " +
        (danger ? "text-danger" : "")
      }
      data-testid={testid}
    >
      {icon}
      {children}
    </DropdownMenu.Item>
  );
}

function actionTitle(action: ActionKey | null, target: MemberRow | null) {
  const name = target?.displayName ?? "member";
  switch (action) {
    case "PROMOTE_ADMIN":
      return `Promote ${name} to Admin`;
    case "PROMOTE_MOD":
      return `Promote ${name} to Moderator`;
    case "DEMOTE":
      return `Demote ${name} to Member`;
    case "SUSPEND":
      return `Suspend ${name}`;
    case "BAN":
      return `Ban ${name}`;
    case "REINSTATE":
      return `Reinstate ${name}`;
    case "REMOVE":
      return `Remove ${name}`;
    default:
      return "";
  }
}

function actionButton(action: ActionKey | null) {
  switch (action) {
    case "PROMOTE_ADMIN":
      return "Promote to Admin";
    case "PROMOTE_MOD":
      return "Promote to Moderator";
    case "DEMOTE":
      return "Demote";
    case "SUSPEND":
      return "Suspend";
    case "BAN":
      return "Ban";
    case "REINSTATE":
      return "Reinstate";
    case "REMOVE":
      return "Remove";
    default:
      return "Confirm";
  }
}
