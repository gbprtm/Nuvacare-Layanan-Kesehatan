import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { nowWib } from "@/lib/waktu-wib";

export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_IDLE_TIMEOUT_SECONDS = 15 * 60;
export const SESSION_ABSOLUTE_TIMEOUT_SECONDS = 7 * 24 * 60 * 60;

const secretKey = new TextEncoder().encode(env.SESSION_SECRET);

const sessionPayloadSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["pasien", "admin"]),
  sessionId: z.string().uuid(),
  expiresAt: z.string().datetime(),
});

export type AuthSessionPayload = z.infer<typeof sessionPayloadSchema>;

export async function createSessionToken(
  payload: AuthSessionPayload,
  now = nowWib().getTime()
): Promise<string> {
  const nowSeconds = Math.floor(now / 1000);
  const absoluteExpirySeconds = Math.floor(Date.parse(payload.expiresAt) / 1000);
  const tokenExpirySeconds = Math.min(
    nowSeconds + SESSION_IDLE_TIMEOUT_SECONDS,
    absoluteExpirySeconds
  );

  if (!Number.isFinite(absoluteExpirySeconds) || tokenExpirySeconds <= nowSeconds) {
    throw new Error("Masa berlaku sesi tidak valid.");
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(tokenExpirySeconds)
    .sign(secretKey);
}

export async function verifySessionToken(
  token: string,
  now = nowWib().getTime()
): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
      currentDate: new Date(now),
    });
    const parsed = sessionPayloadSchema.safeParse(payload);

    if (
      typeof payload.exp !== "number" ||
      !parsed.success ||
      Date.parse(parsed.data.expiresAt) <= now
    ) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookiePrefix = `${SESSION_COOKIE_NAME}=`;
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookiePrefix));

  return cookie ? cookie.slice(cookiePrefix.length) : null;
}

export async function hashSessionId(sessionId: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(sessionId)
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function sessionCookieOptions(expiresAt: string, now = nowWib().getTime()) {
  const absoluteRemaining = Math.floor((Date.parse(expiresAt) - now) / 1000);
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(0, Math.min(SESSION_IDLE_TIMEOUT_SECONDS, absoluteRemaining)),
  };
}

export async function attachRefreshedSessionCookie(
  response: NextResponse,
  session: AuthSessionPayload
): Promise<NextResponse> {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    await createSessionToken(session),
    sessionCookieOptions(session.expiresAt)
  );
  return response;
}
