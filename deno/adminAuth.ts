import { parse } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { createHmac } from "node:crypto";

// Load environment variables
let env: Record<string, string> = {};
try {
  env = await parse(await Deno.readTextFile("./.env"));
} catch {
  env = Deno.env.toObject();
}

const ADMIN_PASSWORD = env.ADMIN_PASSWORD || Deno.env.get("ADMIN_PASSWORD") || "vibenote2026admin";

// In-memory active admin sessions store: token -> timestamp (for local fallback)
const activeSessions = new Map<string, number>();
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days
const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 Days in seconds

export function checkAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD || !password) return false;
  return password.trim() === ADMIN_PASSWORD.trim();
}

export function generateStatelessToken(): string {
  const timestamp = Date.now().toString();
  const salt = crypto.randomUUID().replace(/-/g, "");
  const payload = `${timestamp}:${salt}`;
  const sig = createHmac("sha256", ADMIN_PASSWORD).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyStatelessToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const trimmed = token.trim();
  const dotIdx = trimmed.indexOf(".");
  if (dotIdx === -1) return false;

  const payload = trimmed.slice(0, dotIdx);
  const sig = trimmed.slice(dotIdx + 1);
  if (!payload || !sig) return false;

  const expectedSig = createHmac("sha256", ADMIN_PASSWORD).update(payload).digest("hex");
  if (sig !== expectedSig) return false;

  const colonIdx = payload.indexOf(":");
  const timestampStr = colonIdx !== -1 ? payload.slice(0, colonIdx) : payload;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check if session has expired
  if (Date.now() - timestamp > SESSION_MAX_AGE_MS) {
    return false;
  }

  return true;
}

export function isAdminAuthenticated(req: Request): boolean {
  // 1. Direct password in header
  const headerPwd = req.headers.get("x-admin-password");
  if (headerPwd && checkAdminPassword(headerPwd)) {
    return true;
  }

  // 2. Authorization header: Bearer <password> or Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerVal = authHeader.slice(7).trim();
    if (checkAdminPassword(bearerVal) || verifyStatelessToken(bearerVal)) {
      return true;
    }
  }

  // 3. Custom admin token header
  const headerToken = req.headers.get("x-admin-token");
  if (headerToken && (verifyStatelessToken(headerToken) || checkAdminPassword(headerToken))) {
    return true;
  }

  // 4. Session cookie (stateless HMAC token or legacy UUID)
  const cookieToken = getSessionTokenFromRequest(req);
  if (cookieToken) {
    if (verifyStatelessToken(cookieToken) || checkAdminPassword(cookieToken)) {
      return true;
    }
    const memTimestamp = activeSessions.get(cookieToken);
    if (memTimestamp && (Date.now() - memTimestamp <= SESSION_MAX_AGE_MS)) {
      return true;
    }
  }

  // 5. Query parameters fallback (e.g. for embeds or direct links)
  try {
    const url = new URL(req.url);
    const qToken = url.searchParams.get("admin_token");
    if (qToken && (verifyStatelessToken(qToken) || checkAdminPassword(qToken))) {
      return true;
    }
    const qPwd = url.searchParams.get("admin_password");
    if (qPwd && checkAdminPassword(qPwd)) {
      return true;
    }
  } catch {
    // Ignore invalid url
  }

  return false;
}

export function createAdminSession(): { token: string; cookieHeader: string } {
  const token = generateStatelessToken();
  activeSessions.set(token, Date.now());

  // Clean expired sessions periodically
  cleanExpiredSessions();

  const cookieHeader = `vibenote_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SEC}`;
  return { token, cookieHeader };
}

export function clearAdminSession(req: Request): string {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    activeSessions.delete(token);
  }
  return `vibenote_session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function getSessionTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith("vibenote_session=")) {
      return decodeURIComponent(cookie.substring("vibenote_session=".length).trim());
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
