"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Wrench, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Role = "MEMBER" | "OWNER";

export function RolePicker() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!role) return;
    setSaving(true);
    await fetch("/api/user/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.push(role === "OWNER" ? "/owner/create" : "/home");
    router.refresh();
  }

  return (
    <div className="space-y-5" data-testid="role-picker">
      <div className="grid md:grid-cols-2 gap-4 text-left">
        <RoleCard
          selected={role === "MEMBER"}
          onSelect={() => setRole("MEMBER")}
          icon={<Compass size={22} />}
          tag="Browse & collect"
          title="I'm here to join marketplaces."
          description="Discover vetted communities, apply to join, and buy or bid on what you love."
          testid="role-member"
        />
        <RoleCard
          selected={role === "OWNER"}
          onSelect={() => setRole("OWNER")}
          icon={<Wrench size={22} />}
          tag="Build & run"
          title="I want to run a marketplace."
          description="Set up your community in minutes — your schema, your members, your rules."
          testid="role-owner"
        />
      </div>
      <div className="flex items-center justify-center gap-3 pt-3">
        <Button
          variant="primary"
          size="lg"
          disabled={!role || saving}
          onClick={save}
          data-testid="continue-role"
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function RoleCard({
  selected,
  onSelect,
  icon,
  tag,
  title,
  description,
  testid,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={testid}
      aria-pressed={selected}
      className={`text-left bg-surface border rounded-[14px] p-6 transition ${
        selected ? "border-blue shadow ring-[3px] ring-[var(--blue-softer)]" : "border-line hover:shadow"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-[10px] grid place-items-center ${selected ? "bg-blue text-white" : "bg-blue-soft text-blue-ink"}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-muted mb-1.5">{tag}</div>
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-1.5">{title}</h3>
          <p className="text-[13.5px] text-ink-soft leading-[1.55]">{description}</p>
        </div>
        {selected && <Check size={18} className="text-blue flex-none mt-1" />}
      </div>
    </button>
  );
}
