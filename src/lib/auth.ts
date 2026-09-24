/**
 * Minimal single-admin auth: credentials come from env (ADMIN_EMAIL / ADMIN_PASSWORD),
 * the session is an HMAC-signed cookie. Swap for Supabase Auth when you need multiple staff accounts.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "dh_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const secret = () => process.env.AUTH_SECRET || process.env.SUPABASE_SECRET_KEY || "dev-only-insecure-secret";

export const adminEmail = () => process.env.ADMIN_EMAIL || "admin@dolphinhouse.vn";
export const usingDefaultPassword = () => !process.env.ADMIN_PASSWORD;

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkCredentials(email: string, password: string) {
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  return safeEqual(email.trim().toLowerCase(), adminEmail().toLowerCase()) && safeEqual(password, expected);
}

export function createSessionToken() {
  const payload = `${adminEmail()}|${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  return { token: `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`, maxAge: MAX_AGE };
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  const payload = Buffer.from(b64, "base64url").toString();
  if (!safeEqual(sig, sign(payload))) return false;
  const [email, exp] = payload.split("|");
  return email === adminEmail() && Number(exp) > Date.now() / 1000;
}
