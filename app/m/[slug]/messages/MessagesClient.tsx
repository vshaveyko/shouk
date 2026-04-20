"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

export type ThreadSummary = {
  id: string;
  otherName: string;
  otherImage: string | null;
  listing: {
    id: string;
    title: string;
    priceCents: number | null;
    currency: string;
  } | null;
  preview: string;
  lastAt: string;
  unread: boolean;
};

export type MessageItem = {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

const css = `
.msgs { display: grid; grid-template-columns: 360px 1fr; min-height: calc(100vh - 60px); background: #fff; }
@media (max-width: 900px) { .msgs { grid-template-columns: 1fr; } }
.msgs .msg-list { border-right: 1px solid var(--line); display: flex; flex-direction: column; min-height: 0; }
.msgs .msg-list-head { padding: 18px 18px 12px; border-bottom: 1px solid var(--line); }
.msgs .msg-list-head h2 { margin: 0; font-size: 17px; letter-spacing: -0.01em; font-weight: 600; }
.msgs .msg-list-head .mp-sub { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
.msgs .msg-list-scroll { flex: 1; overflow-y: auto; }
.msgs .msg-thread { display: flex; gap: 11px; padding: 12px 14px; border-bottom: 1px solid var(--line-soft); cursor: pointer; background: #fff; border-left: 0; border-right: 0; border-top: 0; width: 100%; text-align: left; }
.msgs .msg-thread.on { background: var(--hover); }
.msgs .msg-thread:hover { background: var(--bg-soft); }
.msgs .msg-thumb { width: 42px; height: 42px; border-radius: 9px; flex: none; background: linear-gradient(135deg, oklch(0.5 0.18 25), oklch(0.25 0.08 25)); overflow: hidden; }
.msgs .msg-thumb img { width: 100%; height: 100%; object-fit: cover; }
.msgs .msg-body { flex: 1; min-width: 0; }
.msgs .msg-body .mt-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.msgs .msg-body .mt-name { font-size: 13px; font-weight: 600; }
.msgs .msg-body .mt-time { font-size: 11px; color: var(--muted); }
.msgs .msg-body .mt-listing { font-size: 11.5px; color: var(--blue-ink); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msgs .msg-body .mt-preview { font-size: 12.5px; color: var(--ink-soft); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msgs .msg-unread { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); margin-top: 6px; flex: none; }

.msgs .msg-panel { display: flex; flex-direction: column; min-height: 0; }
.msgs .msg-panel-head { display: flex; align-items: center; padding: 14px 20px; gap: 14px; border-bottom: 1px solid var(--line); }
.msgs .msg-panel-head .pthumb { width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, oklch(0.5 0.18 25), oklch(0.25 0.08 25)); overflow: hidden; flex: none; }
.msgs .msg-panel-head .pthumb img { width: 100%; height: 100%; object-fit: cover; }
.msgs .msg-panel-head .ph-name { font-size: 14px; font-weight: 600; }
.msgs .msg-panel-head .ph-sub { font-size: 11.5px; color: var(--muted); }
.msgs .msg-panel-head .ph-listing { margin-left: auto; padding: 6px 11px; border-radius: 8px; background: var(--bg-soft); font-size: 12px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--line); text-decoration: none; color: var(--ink); }
.msgs .msg-panel-head .ph-listing:hover { background: var(--hover); }
.msgs .msg-panel-head .ph-listing .pr { font-weight: 600; }

.msgs .msg-body-scroll { flex: 1; padding: 22px 24px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.msgs .daydiv { align-self: center; font-size: 11px; color: var(--muted); margin: 6px 0; }
.msgs .bubble { max-width: 64%; padding: 10px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
.msgs .bubble.me { align-self: flex-end; background: var(--ink); color: #fff; border-bottom-right-radius: 4px; }
.msgs .bubble.them { align-self: flex-start; background: var(--bg-soft); color: var(--ink); border: 1px solid var(--line); border-bottom-left-radius: 4px; }
.msgs .bubble .bt { font-size: 10.5px; opacity: 0.6; display: block; margin-top: 4px; }

.msgs .msg-compose { padding: 14px 20px; border-top: 1px solid var(--line); display: flex; gap: 10px; align-items: flex-end; }
.msgs .msg-compose textarea { flex: 1; min-height: 42px; max-height: 160px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg-soft); padding: 11px 14px; font: inherit; font-size: 13.5px; resize: none; color: var(--ink); outline: none; }
.msgs .msg-compose textarea:focus { border-color: var(--blue); background: #fff; }
.msgs .msg-compose .msg-send { width: 42px; height: 42px; border-radius: 10px; background: var(--ink); color: #fff; display: grid; place-items: center; border: 0; cursor: pointer; flex: none; }
.msgs .msg-compose .msg-send:disabled { opacity: 0.4; cursor: not-allowed; }
.msgs .msg-compose .msg-send svg { width: 16px; height: 16px; }

.msgs .msg-empty-list, .msgs .msg-empty-panel { padding: 40px 24px; text-align: center; color: var(--muted); font-size: 13px; }
.msgs .msg-empty-panel { height: 100%; display: flex; align-items: center; justify-content: center; }
`;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function formatPrice(cents: number | null, currency: string) {
  if (cents == null) return null;
  const v = cents / 100;
  const f = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return f.format(v);
}

export function MessagesClient({
  slug,
  marketplaceName,
  currentUserId: _currentUserId,
  threads,
  selectedId,
  selectedMessages,
}: {
  slug: string;
  marketplaceName: string;
  currentUserId: string;
  threads: ThreadSummary[];
  selectedId: string | null;
  selectedMessages: MessageItem[];
}) {
  const router = useRouter();
  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedMessages.length, selectedId]);

  async function onSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/marketplaces/${slug}/messages/${selected.id}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body: draft.trim() }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to send");
      }
      setDraft("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  function selectThread(id: string) {
    if (id === selectedId) return;
    router.push(`/m/${slug}/messages?t=${id}`);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="msgs" data-testid="messages-root">
        <div className="msg-list">
          <div className="msg-list-head">
            <h2>Messages</h2>
            <div className="mp-sub">{marketplaceName}</div>
          </div>
          <div className="msg-list-scroll">
            {threads.length === 0 ? (
              <div className="msg-empty-list" data-testid="messages-empty">
                No conversations yet. Message a seller from a listing to start
                one.
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  data-testid="thread-row"
                  className={"msg-thread" + (t.id === selectedId ? " on" : "")}
                  onClick={() => selectThread(t.id)}
                >
                  <span className="msg-thumb">
                    {t.otherImage ? (
                      <img src={t.otherImage} alt="" />
                    ) : null}
                  </span>
                  <span className="msg-body">
                    <span className="mt-top">
                      <span className="mt-name">{t.otherName}</span>
                      <span className="mt-time">{formatRelative(t.lastAt)}</span>
                    </span>
                    {t.listing ? (
                      <span className="mt-listing">{t.listing.title}</span>
                    ) : null}
                    <span className="mt-preview">
                      {t.preview || "No messages yet"}
                    </span>
                  </span>
                  {t.unread ? <span className="msg-unread" /> : null}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="msg-panel">
          {!selected ? (
            <div className="msg-empty-panel">
              Select a conversation to view messages.
            </div>
          ) : (
            <>
              <div className="msg-panel-head">
                <span className="pthumb">
                  {selected.otherImage ? (
                    <img src={selected.otherImage} alt="" />
                  ) : (
                    <span
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {initials(selected.otherName)}
                    </span>
                  )}
                </span>
                <div>
                  <div className="ph-name">{selected.otherName}</div>
                  <div className="ph-sub">{marketplaceName}</div>
                </div>
                {selected.listing ? (
                  <a
                    className="ph-listing"
                    href={`/l/${selected.listing.id}`}
                    data-testid="thread-listing-link"
                  >
                    <span>{selected.listing.title}</span>
                    {selected.listing.priceCents != null ? (
                      <span className="pr">
                        {formatPrice(
                          selected.listing.priceCents,
                          selected.listing.currency,
                        )}
                      </span>
                    ) : null}
                  </a>
                ) : null}
              </div>

              <div className="msg-body-scroll" ref={scrollRef}>
                {selectedMessages.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", margin: "auto" }}>
                    Say hi — this is the start of your conversation.
                  </div>
                ) : (
                  selectedMessages.map((m) => (
                    <div
                      key={m.id}
                      data-testid="message-bubble"
                      className={"bubble " + (m.mine ? "me" : "them")}
                    >
                      {m.body}
                      <span className="bt">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <form className="msg-compose" onSubmit={onSend}>
                <textarea
                  data-testid="message-composer"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                    }
                  }}
                />
                <button
                  type="submit"
                  className="msg-send"
                  aria-label="Send"
                  data-testid="message-send"
                  disabled={!draft.trim() || sending}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
