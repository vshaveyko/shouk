"use client";

import * as React from "react";
import { Download, Sparkles } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Avatar,
} from "@/components/ui";
import { formatCents } from "@/lib/utils";
import { i18n } from '@shipeasy/sdk/client'

type Member = {
  id: string;
  joinedAt: string;
  role: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
  user: {
    id: string;
    displayName: string;
    email: string;
    image: string | null;
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

export function BillingPanel({
  slug,
  isPaid,
  monthlyPriceCents,
  annualPriceCents,
  members,
}: {
  slug: string;
  isPaid: boolean;
  monthlyPriceCents: number | null;
  annualPriceCents: number | null;
  members: Member[];
}) {
  function exportCsv() {
    const rows: string[] = [];
    rows.push(["Name", "Email", "Role", "Joined"].join(","));
    for (const m of members) {
      const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
      rows.push(
        [
          esc(m.user.displayName),
          esc(m.user.email),
          esc(m.role),
          esc(new Date(m.joinedAt).toISOString()),
        ].join(","),
      );
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-subscribers.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5" data-testid="billing-panel">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{i18n.t('...billing.billingPanel.shouksFee')}</CardTitle>
              <CardDescription>
                {i18n.t('...billing.billingPanel.ourPlatformFeeForMarketplace')}
              </CardDescription>
            </div>
            <Badge variant="blue">{i18n.t('...billing.billingPanel.mvpBeta')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-[10px] border border-blue/20 bg-blue-soft px-4 py-3 flex items-start gap-3">
            <Sparkles size={16} className="text-blue-ink shrink-0 mt-0.5" />
            <div className="text-[13px] text-ink-soft">
              <span className="font-medium text-ink">
                {i18n.t('...billing.billingPanel.yourMarketplaceIsFreeDuring')}
              </span>{" "}
              {i18n.t('...billing.billingPanel.wellIntroducePricingGraduallyYoull')}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{i18n.t('...billing.billingPanel.currentPricing')}</CardTitle>
              <CardDescription>
                {i18n.t('...billing.billingPanel.whatMembersPayToJoin')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              className="rounded-[10px] border border-line bg-surface p-4"
              data-testid="billing-status"
            >
              <div className="text-[12px] uppercase tracking-[0.14em] text-muted font-semibold">
                {i18n.t('common.status')}
              </div>
              <div className="text-[18px] font-semibold mt-1">
                {isPaid ? i18n.t('common.paidMembership') : i18n.t('common.free')}
              </div>
            </div>
            <div
              className="rounded-[10px] border border-line bg-surface p-4"
              data-testid="billing-monthly"
            >
              <div className="text-[12px] uppercase tracking-[0.14em] text-muted font-semibold">
                {i18n.t('...billing.billingPanel.monthly')}
              </div>
              <div className="text-[18px] font-semibold mt-1 tabular-nums">
                {isPaid && monthlyPriceCents ? formatCents(monthlyPriceCents) : "—"}
              </div>
            </div>
            <div
              className="rounded-[10px] border border-line bg-surface p-4"
              data-testid="billing-annual"
            >
              <div className="text-[12px] uppercase tracking-[0.14em] text-muted font-semibold">
                {i18n.t('...billing.billingPanel.annual')}
              </div>
              <div className="text-[18px] font-semibold mt-1 tabular-nums">
                {isPaid && annualPriceCents ? formatCents(annualPriceCents) : "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{i18n.t('...billing.billingPanel.subscribers')}</CardTitle>
              <CardDescription>
                {members.length} {i18n.t('...billing.billingPanel.activeMember')}{members.length === 1 ? "" : "s"}.
                {isPaid ? i18n.t('...billing.billingPanel.theseAreYourPayingMembers') : ""}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5"
              data-testid="billing-export-csv"
              onClick={exportCsv}
              disabled={members.length === 0}
            >
              <Download size={14} /> {i18n.t('...billing.billingPanel.exportCsv')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-[13px] text-muted">{i18n.t('...billing.billingPanel.noSubscribersYet')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="billing-subscribers-table">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-muted border-b border-line-soft">
                    <th className="py-2 pr-3 font-semibold">{i18n.t('common.member')}</th>
                    <th className="py-2 pr-3 font-semibold">{i18n.t('common.role')}</th>
                    <th className="py-2 pr-3 font-semibold tabular-nums">{i18n.t('common.joined')}</th>
                    <th className="py-2 pr-3 font-semibold text-right tabular-nums">
                      {i18n.t('common.status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-line-soft last:border-0"
                      data-testid={`billing-subscriber-${m.user.id}`}
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
                          {m.role}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-[13px] text-ink-soft tabular-nums">
                        {formatDate(m.joinedAt)}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <Badge variant="approved">{i18n.t('common.active')}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
