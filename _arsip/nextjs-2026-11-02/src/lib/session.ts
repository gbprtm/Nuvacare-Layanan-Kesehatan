import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 hari dalam detik

export interface SessionPayload {
  userId: string;
  role: "pasien" | "admin";
  sessionId?: string;
  expiresAt?: string;
}

const secretKey = new TextEncoder().encode(env.SESSION_SECRET);

/**
 * Membuat token JWT terenkripsi/tertanda tangan untuk sesi pengguna.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  return new SignJWT({ ...payload, expiresAt: expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey);
}

/**
 * Memverifikasi token JWT dan mengembalikan payload jika valid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (!payload.userId || !payload.role) {
      return null;
    }

    return {
      userId: payload.userId as string,
      role: payload.role as "pasien" | "admin",
      sessionId: payload.sessionId as string | undefined,
      expiresAt: payload.expiresAt as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Menetapkannya ke cookie HTTP-only di Next.js Server Side context.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Menghapus cookie sesi (Logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Mengambil sesi pengguna aktif dari cookie server-side.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
