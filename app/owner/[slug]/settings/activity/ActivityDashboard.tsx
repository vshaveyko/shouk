"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity as ActivityIcon,
  Minus,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { cn, formatCents } from "@/lib/utils";

type Analytics = {
  members: { total: number; last30: number; prev30: number };
  listings: { total: number; last7: number; last30: number };
  applications: {
    pending: number;
    approvedLast30: number;
    rejectedLast30: number;
  };
  revenue: { activeMonthlyCents: number; activeAnnualCents: number };
};

export function ActivityDashboard({ slug }: { slug: string }) {
  const [data, setData] = React.useState<Analytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/marketplaces/${slug}/analytics`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json: Analytics) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load analytics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-5" data-testid="activity-loading">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-[10px] border border-line bg-surface animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent>
          <p className="text-[13px] text-danger" data-testid="activity-error">
            {error ?? "No data available."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const memberDelta = data.members.last30 - data.members.prev30;
  const memberPct = data.members.prev30
    ? Math.round((memberDelta / data.members.prev30) * 100)
    : null;

  return (
    <div className="space-y-5" data-testid="activity-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          testid="analytics-members-total"
          label="Members"
          value={data.members.total.toLocaleString()}
          trend={memberDelta}
          trendLabel={
            memberPct != null
              ? `${memberPct >= 0 ? "+" : ""}${memberPct}% vs prev 30d`
              : `${data.members.last30} joined in the last 30d`
          }
          sparkline={[
            data.members.prev30,
            Math.max(0, data.members.prev30 + (memberDelta > 0 ? -2 : 2)),
            data.members.prev30 + Math.round(memberDelta / 2),
            data.members.last30,
            data.members.last30 + Math.round(memberDelta / 3),
          ]}
        />
        <StatCard
          testid="analytics-members-last30"
          label="New members (30d)"
          value={data.members.last30.toLocaleString()}
          trend={memberDelta}
          trendLabel={
            memberPct != null
              ? `${memberPct >= 0 ? "+" : ""}${memberPct}% vs prev 30d`
              : "First reporting window"
          }
        />
        <StatCard
          testid="analytics-listings-total"
          label="Total listings"
          value={data.listings.total.toLocaleString()}
          trendLabel={`${data.listings.last7} added this week`}
        />
        <StatCard
          testid="analytics-listings-last30"
          label="Listings (30d)"
          value={data.listings.last30.toLocaleString()}
          trendLabel={`${data.listings.last7} of those in the last 7d`}
        />
        <StatCard
          testid="analytics-applications-pending"
          label="Pending applications"
          value={data.applications.pending.toLocaleString()}
          trendLabel={`${data.applications.approvedLast30} approved in 30d`}
        />
        <StatCard
          testid="analytics-applications-reviewed"
          label="Reviewed apps (30d)"
          value={(
            data.applications.approvedLast30 + data.applications.rejectedLast30
          ).toLocaleString()}
          trendLabel={`${data.applications.rejectedLast30} rejected`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>
            Estimated based on active members and configured pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className="rounded-[10px] border border-line bg-surface p-4"
              data-testid="analytics-revenue-monthly"
            >
              <div className="text-[12px] uppercase tracking-[0.14em] text-muted font-semibold">
                Active monthly
              </div>
              <div className="text-[24px] font-semibold tracking-[-0.01em] tabular-nums mt-1">
                {formatCents(data.revenue.activeMonthlyCents)}
              </div>
            </div>
            <div
              className="rounded-[10px] border border-line bg-surface p-4"
              data-testid="analytics-revenue-annual"
            >
              <div className="text-[12px] uppercase tracking-[0.14em] text-muted font-semibold">
                Active annual
              </div>
              <div className="text-[24px] font-semibold tracking-[-0.01em] tabular-nums mt-1">
                {formatCents(data.revenue.activeAnnualCents)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  sparkline,
  testid,
}: {
  label: string;
  value: string;
  trend?: number;
  trendLabel: string;
  sparkline?: number[];
  testid: string;
}) {
  const direction =
    trend == null ? "flat" : trend > 0 ? "up" : trend < 0 ? "down" : "flat";
  const Icon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const tone =
    direction === "up"
      ? "text-success"
      : direction === "down"
        ? "text-danger"
        : "text-muted";

  return (
    <div
      className="rounded-[10px] border border-line bg-surface p-4"
      data-testid={testid}
    >
      <div className="flex items-center justify-between">
        <div className="text-[12px] uppercase tracking-[0.14em] text-muted font-semibold">
          {label}
        </div>
        <ActivityIcon size={14} className="text-muted" />
      </div>
      <div className="text-[24px] font-semibold tracking-[-0.01em] tabular-nums mt-1">
        {value}
      </div>
      <div className={cn("mt-1 flex items-center gap-1 text-[12px]", tone)}>
        <Icon size={12} />
        <span>{trendLabel}</span>
      </div>
      {sparkline && sparkline.length >= 2 && (
        <Sparkline values={sparkline} className="mt-2" />
      )}
    </div>
  );
}

function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const width = 120;
  const height = 28;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / (max - min || 1)) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full h-7", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        points={pts}
        fill="none"
        stroke="var(--blue)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
