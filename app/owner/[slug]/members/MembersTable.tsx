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
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "Indefinite", days: 0 },
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
        alert((await res.json().catch(() => null))?.error ?? "Failed");
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
            placeholder="Search name or email"
            data-testid="members-search"
          />
        </div>
        <div className="members-filters">
          <div style={{ width: 150 }}>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div style={{ width: 150 }}>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="BANNED">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button type="button" className="filter-chip" onClick={() => changeSort("joined")}>
            Sort: {sortKey === "joined" ? "Joined" : sortKey === "name" ? "Name" : "Listings"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="m-table" data-testid="members-table">
        <div className="m-thead">
          <input type="checkbox" aria-label="Select all" />
          <span>Member</span>
          <span>Joined</span>
          <span>Listings</span>
          <span>Role</span>
          <span>Status</span>
          <span />
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">No members match your filters.</div>
        ) : (
          filtered.map((r, i) => {
            const grad = avatarGradients[i % avatarGradients.length];
            return (
              <div
                key={r.userId}
                className="m-row"
                data-testid={`member-row-${r.userId}`}
              >
                <input type="checkbox" aria-label={`Select ${r.displayName}`} />
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
                  Duration
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
                  Reason{action === "BAN" ? "" : " (optional)"}
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    action === "BAN"
                      ? "Why is this member being banned?"
                      : "Optional context"
                  }
                  data-testid="member-reason"
                />
              </div>
            )}

            {action === "REMOVE" && (
              <p className="text-[13px] text-ink-soft">
                This removes the membership. The user's public identity is unchanged;
                their listings stay unless you ban them.
              </p>
            )}

            {(action === "PROMOTE_ADMIN" ||
              action === "PROMOTE_MOD" ||
              action === "DEMOTE" ||
              action === "REINSTATE") && (
              <p className="text-[13px] text-ink-soft">
                {action === "PROMOTE_ADMIN" &&
                  "Admins can invite, approve applications, and manage listings."}
                {action === "PROMOTE_MOD" &&
                  "Moderators can review applications and remove listings."}
                {action === "DEMOTE" && "This role will be reset to Member."}
                {action === "REINSTATE" &&
                  "Clears any suspension or ban and restores active access."}
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
              Cancel
            </Button>
            <Button
              variant={action === "BAN" || action === "REMOVE" ? "danger" : "primary"}
              onClick={confirm}
              disabled={busy || (action === "BAN" && !reason)}
              data-testid="member-confirm"
            >
              {busy ? "Working…" : actionButton(action)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoleChip({ role }: { role: MemberRow["role"] }) {
  if (role === "OWNER") return <span className="m-role owner">Owner</span>;
  if (role === "ADMIN") return <span className="m-role admin">Admin</span>;
  if (role === "MODERATOR") return <span className="m-role moderator">Moderator</span>;
  return <span className="m-role">Member</span>;
}

function StatusChip({ status }: { status: MemberRow["status"] }) {
  if (status === "ACTIVE")
    return (
      <span className="m-role" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
        Active
      </span>
    );
  if (status === "SUSPENDED")
    return (
      <span className="m-role" style={{ background: "var(--warn-soft)", color: "oklch(0.48 0.15 50)" }}>
        Suspended
      </span>
    );
  return (
    <span className="m-role suspended">Banned</span>
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
  if (role === "OWNER") return <Badge variant="blue">Owner</Badge>;
  if (role === "ADMIN") return <Badge variant="blue">Admin</Badge>;
  if (role === "MODERATOR") return <Badge variant="neutral">Moderator</Badge>;
  return <Badge variant="outline">Member</Badge>;
}

function StatusPill({ status }: { status: MemberRow["status"] }) {
  if (status === "ACTIVE") return <Badge variant="approved">Active</Badge>;
  if (status === "SUSPENDED") return <Badge variant="pending">Suspended</Badge>;
  return <Badge variant="rejected">Banned</Badge>;
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
        <button type="button" className="icon-btn" aria-label="Member actions">
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
              Promote to Admin
            </Item>
          )}
          {row.role !== "MODERATOR" && row.role !== "ADMIN" && row.status !== "BANNED" && (
            <Item
              icon={<Shield size={14} />}
              onSelect={() => onAction(row, "PROMOTE_MOD")}
              testid="member-action-PROMOTE_MOD"
            >
              Promote to Moderator
            </Item>
          )}
          {(row.role === "ADMIN" || row.role === "MODERATOR") && (
            <Item
              icon={<ArrowDownToLine size={14} />}
              onSelect={() => onAction(row, "DEMOTE")}
              testid="member-action-DEMOTE"
            >
              Demote to Member
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
                Suspend…
              </Item>
              <Item
                icon={<Ban size={14} />}
                onSelect={() => onAction(row, "BAN")}
                danger
                testid="member-action-BAN"
              >
                Ban…
              </Item>
            </>
          ) : (
            <Item
              icon={<RotateCcw size={14} />}
              onSelect={() => onAction(row, "REINSTATE")}
              testid="member-action-REINSTATE"
            >
              Reinstate
            </Item>
          )}
          <Item
            icon={<UserMinus size={14} />}
            onSelect={() => onAction(row, "REMOVE")}
            danger
            testid="member-action-REMOVE"
          >
            Remove from marketplace
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
