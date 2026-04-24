"use client";

/**
 * WhatsAppQRModal — shows a QR the user scans with their phone,
 * polls session status every 2s, then runs the mode-specific flow:
 *   - setup:  (owner) pick an admin group → POST /api/whatsapp/setup
 *   - join:   (member) auto-match user's groups → POST /api/whatsapp/join
 *   - verify: (applicant) confirm membership of one group → POST /api/whatsapp/verify
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { X, Check, Users } from "lucide-react";

interface WhatsAppGroup {
  id: string;
  name: string;
  isAdmin: boolean;
  memberCount: number;
}

interface SessionStatus {
  state: "pending" | "qr_ready" | "authenticated" | "expired";
  qrDataUri?: string;
  phone?: string;
  groups?: WhatsAppGroup[];
}

interface SetupProps {
  mode: "setup";
  marketplaceId: string;
  onDone: (groupName: string, invited: number) => void;
  onClose: () => void;
}

interface JoinProps {
  mode: "join";
  onDone: (joined: string[]) => void;
  onClose: () => void;
}

interface VerifyProps {
  mode: "verify";
  marketplaceId: string;
  groupName?: string | null;
  onDone: (result: { verified: boolean; approved: boolean }) => void;
  onClose: () => void;
}

export type WhatsAppQRModalProps = SetupProps | JoinProps | VerifyProps;

export function WhatsAppQRModal(props: WhatsAppQRModalProps) {
  const { onClose } = props;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>({ state: "pending" });
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null);
  const [working, setWorking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/whatsapp/session", { method: "POST" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error ?? "Failed to start session");
          return;
        }
        const { sessionId: id } = await res.json();
        if (!cancelled) setSessionId(id);
      } catch {
        if (!cancelled) setError("Could not reach server");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll status
  useEffect(() => {
    if (!sessionId) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/whatsapp/session/${sessionId}`);
        if (!res.ok) return;
        const s: SessionStatus = await res.json();
        setStatus(s);
        if (s.state === "authenticated" || s.state === "expired") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (sessionId) {
        fetch(`/api/whatsapp/session/${sessionId}`, { method: "DELETE" }).catch(() => {});
      }
    };
  }, [sessionId]);

  // Auto-trigger join
  const joinTriggered = useRef(false);
  useEffect(() => {
    if (props.mode !== "join") return;
    if (status.state !== "authenticated" || joinTriggered.current || !sessionId) return;
    joinTriggered.current = true;
    setWorking(true);
    fetch("/api/whatsapp/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error ?? "Join failed");
        props.onDone(data.joined ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setWorking(false));
  }, [status.state, sessionId]);

  // Auto-trigger verify
  const verifyTriggered = useRef(false);
  useEffect(() => {
    if (props.mode !== "verify") return;
    if (status.state !== "authenticated" || verifyTriggered.current || !sessionId) return;
    verifyTriggered.current = true;
    setWorking(true);
    fetch("/api/whatsapp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, marketplaceId: props.marketplaceId }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error ?? "Verify failed");
        props.onDone({ verified: !!data.verified, approved: !!data.approved });
      })
      .catch((e) => setError(e.message))
      .finally(() => setWorking(false));
  }, [status.state, sessionId]);

  const handleSetupConfirm = useCallback(async () => {
    if (props.mode !== "setup" || !selectedGroup || !sessionId) return;
    setWorking(true);
    try {
      const res = await fetch("/api/whatsapp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplaceId: props.marketplaceId,
          sessionId,
          groupId: selectedGroup.id,
          groupName: selectedGroup.name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Linking failed");
      props.onDone(selectedGroup.name, data.invited ?? 0);
    } catch (e: any) {
      toast.error(e?.message ?? "Linking failed");
    } finally {
      setWorking(false);
    }
  }, [props, selectedGroup, sessionId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      data-testid="whatsapp-modal"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm relative">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.948-1.418A9.945 9.945 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.182 8.182 0 1 1 0-16.364 8.182 8.182 0 0 1 0 16.364z" />
            </svg>
            <h2 className="font-semibold text-base">
              {props.mode === "setup"
                ? "Link WhatsApp Group"
                : props.mode === "verify"
                  ? "Verify with WhatsApp"
                  : "Join via WhatsApp"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-5">
          {error && (
            <div
              className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive mb-4"
              data-testid="whatsapp-error"
            >
              {error}
            </div>
          )}

          {!error && status.state === "pending" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Starting WhatsApp…</p>
            </div>
          )}

          {!error && status.state === "qr_ready" && status.qrDataUri && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={status.qrDataUri}
                alt="WhatsApp QR"
                className="rounded-xl border border-border w-56 h-56 object-contain"
              />
              <p className="text-xs text-muted-foreground text-center">
                Open WhatsApp → <strong>Linked Devices</strong> → <strong>Link a Device</strong>
              </p>
              <p className="text-[10px] text-muted-foreground/60">QR refreshes automatically</p>
            </div>
          )}

          {!error && status.state === "authenticated" && props.mode === "setup" && (
            <div className="space-y-3" data-testid="whatsapp-group-picker">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-mono font-medium">{status.phone}</span>. Pick
                the group to link:
              </p>
              {(status.groups ?? []).filter((g) => g.isAdmin).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No groups found where you are an admin.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(status.groups ?? [])
                    .filter((g) => g.isAdmin)
                    .map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        data-testid={`whatsapp-group-${g.id}`}
                        onClick={() => setSelectedGroup(g)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                          selectedGroup?.id === g.id
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-border hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {selectedGroup?.id === g.id && (
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{g.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {g.memberCount} members — will be invited
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!selectedGroup || working}
                onClick={handleSetupConfirm}
                data-testid="whatsapp-setup-confirm"
              >
                {working
                  ? "Linking…"
                  : selectedGroup
                    ? `Link "${selectedGroup.name}"`
                    : "Select a group"}
              </Button>
            </div>
          )}

          {!error && status.state === "authenticated" && props.mode === "join" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Checking group memberships…</p>
            </div>
          )}

          {!error && status.state === "authenticated" && props.mode === "verify" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">
                Checking
                {props.groupName ? (
                  <>
                    {" "}
                    membership of <strong>{props.groupName}</strong>
                  </>
                ) : (
                  <> group membership</>
                )}
                …
              </p>
            </div>
          )}

          {status.state === "expired" && (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">Session expired. Close and try again.</p>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
