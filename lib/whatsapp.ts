/**
 * WhatsApp session manager — temporary per-user sessions via whatsapp-web.js.
 *
 * No persistent bot. Each user scans a QR with their own phone, which lets us:
 *   - (owner) see groups they admin → link one to a marketplace + import members
 *   - (member) see all groups they're in → auto-join matching marketplaces
 *
 * Sessions are in-memory, use NoAuth (no disk persistence), and auto-expire
 * after SESSION_TTL_MS of inactivity.
 *
 * Enabled only when WHATSAPP_ENABLED=true. Required env when enabled:
 *   WHATSAPP_CHROME_PATH — optional absolute path to Chromium (Railway/VPS).
 */

import { createRequire } from "module";
import { existsSync } from "fs";
import { execSync } from "child_process";
import { toDataURL as qrToDataURL } from "qrcode";

const _require = createRequire(import.meta.url);

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes idle → destroy

export const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED === "true";

function resolveChromePath(): string | undefined {
  const fromEnv = process.env.WHATSAPP_CHROME_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  for (const cmd of ["chromium", "chromium-browser", "google-chrome"]) {
    try {
      const found = execSync(`command -v ${cmd}`, { encoding: "utf8" }).trim();
      if (found && existsSync(found)) return found;
    } catch {
      // not on PATH, try next
    }
  }
  return undefined;
}

const CHROME_PATH = resolveChromePath();

// ── Types ────────────────────────────────────────────────────────────────

export type SessionState = "pending" | "qr_ready" | "authenticated" | "expired";

export interface WhatsAppGroup {
  id: string; // JID e.g. "120363XXXXX@g.us"
  name: string;
  isAdmin: boolean;
  memberCount: number;
}

export interface SessionStatus {
  state: SessionState;
  qrDataUri?: string;
  phone?: string;
  groups?: WhatsAppGroup[];
}

interface Session {
  id: string;
  client: any;
  state: SessionState;
  qrDataUri: string | null;
  phone: string | null;
  groups: WhatsAppGroup[] | null;
  timer: ReturnType<typeof setTimeout>;
}

// ── Singleton across HMR reloads ─────────────────────────────────────────

class WhatsAppSessionManager {
  private sessions = new Map<string, Session>();

  async createSession(sessionId: string): Promise<void> {
    if (!WHATSAPP_ENABLED) {
      throw new Error("WhatsApp is not enabled on this server.");
    }

    if (this.sessions.has(sessionId)) {
      this.resetTimer(sessionId);
      return;
    }

    const { Client, NoAuth } = _require("whatsapp-web.js");

    const launchOptions: Record<string, unknown> = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    };
    if (CHROME_PATH) launchOptions.executablePath = CHROME_PATH;

    const client = new Client({
      authStrategy: new NoAuth(),
      puppeteer: launchOptions,
    });

    const session: Session = {
      id: sessionId,
      client,
      state: "pending",
      qrDataUri: null,
      phone: null,
      groups: null,
      timer: setTimeout(() => this.destroySession(sessionId), SESSION_TTL_MS),
    };
    this.sessions.set(sessionId, session);

    client.on("qr", async (rawQr: string) => {
      try {
        const dataUri = await qrToDataURL(rawQr, { width: 280, margin: 2 });
        const s = this.sessions.get(sessionId);
        if (s) {
          s.qrDataUri = dataUri;
          s.state = "qr_ready";
          this.resetTimer(sessionId);
        }
      } catch (err) {
        console.error("[WhatsApp] QR generation error:", err);
      }
    });

    client.on("ready", async () => {
      const s = this.sessions.get(sessionId);
      if (!s) return;
      this.resetTimer(sessionId);
      try {
        const info = client.info;
        const phone = "+" + (info?.wid?.user ?? "");
        const chats = await client.getChats();
        const groups: WhatsAppGroup[] = chats
          .filter((c: any) => c.isGroup)
          .map((c: any) => {
            const isAdmin = (c.participants ?? []).some(
              (p: any) => p.id?.user === info?.wid?.user && p.isAdmin,
            );
            return {
              id: c.id?._serialized ?? c.id,
              name: c.name ?? "Group",
              isAdmin,
              memberCount: (c.participants ?? []).length,
            };
          });
        s.phone = phone;
        s.groups = groups;
        s.state = "authenticated";
        this.resetTimer(sessionId);
        console.log(
          `[WhatsApp] Session ${sessionId} authenticated as ${phone}, ${groups.length} groups`,
        );
      } catch (err) {
        console.error("[WhatsApp] ready handler error:", err);
      }
    });

    client.on("auth_failure", () => {
      const s = this.sessions.get(sessionId);
      if (s) s.state = "expired";
    });

    client.on("disconnected", () => {
      const s = this.sessions.get(sessionId);
      if (s && s.state !== "expired") s.state = "expired";
    });

    client.initialize().catch((err: unknown) => {
      console.error(`[WhatsApp] Session ${sessionId} initialize error:`, err);
      this.destroySession(sessionId);
    });
  }

  getStatus(sessionId: string): SessionStatus {
    const s = this.sessions.get(sessionId);
    if (!s) return { state: "expired" };
    return {
      state: s.state,
      qrDataUri: s.qrDataUri ?? undefined,
      phone: s.phone ?? undefined,
      groups: s.groups ?? undefined,
    };
  }

  async getGroupMembers(sessionId: string, groupJid: string): Promise<string[]> {
    const s = this.sessions.get(sessionId);
    if (!s || s.state !== "authenticated") return [];
    try {
      const chat = await s.client.getChatById(groupJid);
      if (!chat?.isGroup) return [];
      return (chat.participants ?? []).map((p: any) => {
        const user: string = p.id?.user ?? p.id ?? "";
        return "+" + user;
      });
    } catch (err) {
      console.error("[WhatsApp] getGroupMembers error:", err);
      return [];
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    clearTimeout(s.timer);
    this.sessions.delete(sessionId);
    try {
      await s.client.destroy();
    } catch {
      // ignore
    }
    console.log(`[WhatsApp] Session ${sessionId} destroyed`);
  }

  /** Test-only injector: seed an authenticated session without Puppeteer. */
  _injectForTest(sessionId: string, data: { phone: string; groups: WhatsAppGroup[] }) {
    const session: Session = {
      id: sessionId,
      client: {
        destroy: async () => {},
        getChatById: async (jid: string) => {
          const g = data.groups.find((x) => x.id === jid);
          if (!g) return null;
          return {
            isGroup: true,
            participants: Array.from({ length: g.memberCount }, (_, i) => ({
              id: { user: `1555000${String(i).padStart(4, "0")}` },
              isAdmin: false,
            })),
          };
        },
      },
      state: "authenticated",
      qrDataUri: null,
      phone: data.phone,
      groups: data.groups,
      timer: setTimeout(() => this.destroySession(sessionId), SESSION_TTL_MS),
    };
    this.sessions.set(sessionId, session);
  }

  private resetTimer(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    clearTimeout(s.timer);
    s.timer = setTimeout(() => this.destroySession(sessionId), SESSION_TTL_MS);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __waSessions: WhatsAppSessionManager | undefined;
}

export const whatsappSessions =
  globalThis.__waSessions ?? (globalThis.__waSessions = new WhatsAppSessionManager());

// ── SMS stub ─────────────────────────────────────────────────────────────
// Replace with Twilio (or similar) later. For now, log only.
export function sendSmsStub(phone: string, message: string) {
  console.log(
    `[SMS stub] would've called Twilio with this message "${message}" to this number "${phone}"`,
  );
}

/** True if the given session id belongs to the given user (prefix scoping). */
export function sessionBelongsTo(sessionId: string, userId: string) {
  return sessionId.startsWith(`wa_${userId}_`);
}
