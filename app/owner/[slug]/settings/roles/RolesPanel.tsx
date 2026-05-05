"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Search, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Avatar,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { i18n } from '@shipeasy/sdk/client'

type Role = "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";

type Member = {
  id: string;
  userId: string;
  role: Role;
  joinedAt: string;
  permissions: Record<string, boolean> | null;
  user: {
    id: string;
    displayName: string;
    image: string | null;
    email: string;
  };
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function roleLabel(r: Role) {
  if (r === "OWNER") return "Owner";
  if (r === "ADMIN") return "Admin";
  if (r === "MODERATOR") return "Moderator";
  return "Member";
}

export function RolesPanel({
  slug,
  members,
}: {
  slug: string;
  members: Member[];
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [picked, setPicked] = React.useState<Member | null>(null);
  const [assignRole, setAssignRole] = React.useState<"ADMIN" | "MODERATOR">(
    "MODERATOR",
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const staff = members.filter(
    (m) => m.role === "OWNER" || m.role === "ADMIN" || m.role === "MODERATOR",
  );
  const regularMembers = members.filter((m) => m.role === "MEMBER");
  const candidates = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return regularMembers
      .filter(
        (m) =>
          !q ||
          m.user.displayName.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [regularMembers, query]);

  async function act(
    member: Member,
    action: "PROMOTE_ADMIN" | "PROMOTE_MOD" | "DEMOTE" | "REMOVE",
  ) {
    setBusyId(member.id);
    try {
      const res = await fetch(`/api/marketplaces/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.userId, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? i18n.t('...roles.rolesPanel.couldntUpdateRole'));
        return;
      }
      const labels: Record<typeof action, string> = {
        PROMOTE_ADMIN: "Promoted to admin.",
        PROMOTE_MOD: "Promoted to moderator.",
        DEMOTE: "Demoted to member.",
        REMOVE: "Removed from marketplace.",
      };
      toast.success(labels[action]);
      router.refresh();
    } catch {
      toast.error(i18n.t('common.networkErrorPleaseTryAgain'));
    } finally {
      setBusyId(null);
    }
  }

  async function invite() {
    if (!picked) {
      toast.error(i18n.t('...roles.rolesPanel.pickAMemberToPromote'));
      return;
    }
    setBusyId("invite");
    try {
      const res = await fetch(`/api/marketplaces/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: picked.userId,
          action: assignRole === "ADMIN" ? "PROMOTE_ADMIN" : "PROMOTE_MOD",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? i18n.t('...roles.rolesPanel.couldntAddAdmin'));
        return;
      }
      toast.success(
        i18n.t('...roles.rolesPanel.displaynameIsNowVar1', { displayName: String(picked.user.displayName), var1: assignRole === "ADMIN" ? "an admin" : "a moderator" }),
      );
      setInviteOpen(false);
      setPicked(null);
      setQuery("");
      router.refresh();
    } catch {
      toast.error(i18n.t('common.networkErrorPleaseTryAgain'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5" data-testid="roles-panel">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{i18n.t('...roles.rolesPanel.adminsModerators')}</CardTitle>
              <CardDescription>
                {i18n.t('...roles.rolesPanel.peopleWhoHelpRunThis')}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="primary"
              className="gap-1.5"
              data-testid="roles-invite-admin"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus size={16} /> {i18n.t('...roles.rolesPanel.inviteAdmin')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-[13px] text-muted">{i18n.t('...roles.rolesPanel.noAdminsOrModeratorsYet')}</p>
          ) : (
            <table className="w-full" data-testid="roles-staff-table">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-muted border-b border-line-soft">
                  <th className="py-2 pr-3 font-semibold">{i18n.t('common.member')}</th>
                  <th className="py-2 pr-3 font-semibold">{i18n.t('common.role')}</th>
                  <th className="py-2 pr-3 font-semibold tabular-nums">{i18n.t('common.joined')}</th>
                  <th className="py-2 pr-3 font-semibold text-right">{i18n.t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-line-soft last:border-0"
                    data-testid={`roles-row-${m.userId}`}
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={m.user.image}
                          name={m.user.displayName}
                          size={28}
                        />
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium truncate">
                            {m.user.displayName}
                          </div>
                          <div className="text-[12px] text-muted truncate">
                            {m.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge
                        variant={
                          m.role === "OWNER"
                            ? "blue"
                            : m.role === "ADMIN"
                              ? "approved"
                              : "neutral"
                        }
                      >
                        {roleLabel(m.role)}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 text-[13px] text-ink-soft tabular-nums">
                      {formatDate(m.joinedAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center justify-end gap-2">
                        {m.role === "OWNER" ? (
                          <span className="text-[12px] text-muted">
                            {i18n.t('...roles.rolesPanel.ownerIsFixed')}
                          </span>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              data-testid={`roles-demote-${m.userId}`}
                              onClick={() => act(m, "DEMOTE")}
                              disabled={busyId === m.id}
                            >
                              {i18n.t('...roles.rolesPanel.demote')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-danger"
                              data-testid={`roles-remove-${m.userId}`}
                              onClick={() => act(m, "REMOVE")}
                              disabled={busyId === m.id}
                            >
                              <UserMinus size={14} /> {i18n.t('common.remove')}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{i18n.t('...roles.rolesPanel.permissionBundles')}</CardTitle>
          <CardDescription>
            {i18n.t('...roles.rolesPanel.v1ShipsWithFixedBundles')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PermissionBundle
              title={i18n.t('common.admin')}
              description={i18n.t('...roles.rolesPanel.manageListingsMembersAndSettingsDescript')}
              items={[
                { id: "canModerate", label: i18n.t('...roles.rolesPanel.canModerateListings'), fixed: true },
                { id: "canManageMembers", label: i18n.t('...roles.rolesPanel.canManageMembers'), fixed: true },
                { id: "canEditSchema", label: i18n.t('...roles.rolesPanel.canEditListingSchema'), fixed: true },
                { id: "canBilling", label: i18n.t('...roles.rolesPanel.canViewBilling'), fixed: false },
              ]}
            />
            <PermissionBundle
              title={i18n.t('common.moderator')}
              description={i18n.t('...roles.rolesPanel.reviewApproveListingsNoMemberDescription')}
              items={[
                { id: "canModerate", label: i18n.t('...roles.rolesPanel.canModerateListings'), fixed: true },
                { id: "canManageMembers", label: i18n.t('...roles.rolesPanel.canManageMembers'), fixed: false },
                { id: "canEditSchema", label: i18n.t('...roles.rolesPanel.canEditListingSchema'), fixed: false },
                { id: "canBilling", label: i18n.t('...roles.rolesPanel.canViewBilling'), fixed: false },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent width={560}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-soft grid place-items-center shrink-0">
                <ShieldCheck size={18} className="text-blue-ink" />
              </div>
              <div>
                <DialogTitle>{i18n.t('...roles.rolesPanel.inviteAnAdminOrModerator')}</DialogTitle>
                <DialogDescription>
                  {i18n.t('...roles.rolesPanel.pickAnExistingMemberThen')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <div>
              <Label htmlFor="roles-search">{i18n.t('...roles.rolesPanel.findAMember')}</Label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <Input
                  id="roles-search"
                  data-testid="roles-invite-search"
                  placeholder={i18n.t('...roles.rolesPanel.nameOrEmailPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div
              className="mt-3 max-h-[220px] overflow-auto border border-line rounded-[10px] divide-y divide-line-soft"
              data-testid="roles-invite-candidates"
            >
              {candidates.length === 0 ? (
                <div className="p-3 text-[13px] text-muted">
                  {i18n.t('...roles.rolesPanel.noMatchingMembers')}
                </div>
              ) : (
                candidates.map((m) => {
                  const active = picked?.id === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPicked(m)}
                      data-testid={`roles-pick-${m.userId}`}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-left transition",
                        active ? "bg-blue-soft" : "hover:bg-hover",
                      )}
                    >
                      <Avatar
                        src={m.user.image}
                        name={m.user.displayName}
                        size={28}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium truncate">
                          {m.user.displayName}
                        </div>
                        <div className="text-[12px] text-muted truncate">
                          {m.user.email}
                        </div>
                      </div>
                      {active && <Check size={16} className="text-blue-ink" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-4">
              <Label>{i18n.t('common.role')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["ADMIN", "MODERATOR"] as const).map((r) => {
                  const active = assignRole === r;
                  return (
                    <button
                      type="button"
                      key={r}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setAssignRole(r)}
                      data-testid={`roles-role-${r}`}
                      className={cn(
                        "rounded-[10px] border p-3 text-left transition",
                        active
                          ? "border-blue bg-blue-soft"
                          : "border-line bg-surface hover:bg-hover",
                      )}
                    >
                      <div className="text-[14px] font-semibold">
                        {roleLabel(r)}
                      </div>
                      <div className="text-[12.5px] text-muted">
                        {r === "ADMIN"
                          ? i18n.t('...roles.rolesPanel.fullSettingsMemberManagement')
                          : i18n.t('...roles.rolesPanel.moderateListingsOnly')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" data-testid="roles-invite-cancel">
                {i18n.t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="primary"
              data-testid="roles-invite-confirm"
              onClick={invite}
              disabled={!picked || busyId === "invite"}
            >
              {busyId === "invite" ? i18n.t('...roles.rolesPanel.promoting') : i18n.t('...roles.rolesPanel.promote')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PermissionBundle({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: { id: string; label: string; fixed: boolean }[];
}) {
  return (
    <div className="rounded-[10px] border border-line bg-surface p-4">
      <div className="text-[14px] font-semibold">{title}</div>
      <div className="text-[12.5px] text-muted mb-3">{description}</div>
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id} className="flex items-center gap-2 text-[13.5px]">
            <input
              type="checkbox"
              data-testid={`roles-perm-${title.toLowerCase()}-${p.id}`}
              checked={p.fixed}
              readOnly
              disabled
              className="h-4 w-4 rounded border-line text-blue focus:ring-blue"
            />
            <span className={cn(p.fixed ? "text-ink" : "text-muted")}>
              {p.label}
            </span>
            {!p.fixed && (
              <span className="ml-auto text-[11px] text-muted">
                {i18n.t('...roles.rolesPanel.notInBundle')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
