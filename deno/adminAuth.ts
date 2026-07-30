import { parse } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Load environment variables
let env: Record<string, string> = {};
try {
  env = await parse(await Deno.readTextFile("./.env"));
} catch {
  env = Deno.env.toObject();
}

const ADMIN_PASSWORD = env.ADMIN_PASSWORD || Deno.env.get("ADMIN_PASSWORD") || "vibenote2026admin";

// In-memory active admin sessions store: token -> timestamp
const activeSessions = new Map<string, number>();
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 Hours

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createAdminSession(): { token: string; cookieHeader: string } {
  const token = crypto.randomUUID();
  activeSessions.set(token, Date.now());

  // Clean expired sessions periodically
  cleanExpiredSessions();

  const cookieHeader = `vibenote_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
  return { token, cookieHeader };
}

export function clearAdminSession(req: Request): string {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    activeSessions.delete(token);
  }
  return `vibenote_session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function isAdminAuthenticated(req: Request): boolean {
  const token = getSessionTokenFromRequest(req);
  if (!token) return false;

  const timestamp = activeSessions.get(token);
  if (!timestamp) return false;

  // Check if session has expired
  if (Date.now() - timestamp > SESSION_MAX_AGE_MS) {
    activeSessions.delete(token);
    return false;
  }

  return true;
}

function getSessionTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith("vibenote_session=")) {
      return cookie.substring("vibenote_session=".length);
    }
  }
  return null;
}

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, timestamp] of activeSessions.entries()) {
    if (now - timestamp > SESSION_MAX_AGE_MS) {
      activeSessions.delete(token);
    }
  }
}
