import { createHmac, randomUUID } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { nowWib } from "@/lib/waktu-wib";
import { loginAttempts, sessions, users } from "@/db/schema/auth";
import { hashPassword, verifyPassword } from "./password";
import {
  createSessionToken,
  hashSessionId,
  SESSION_ABSOLUTE_TIMEOUT_SECONDS,
  type AuthSessionPayload,
} from "./session-token";

export const MAX_LOGIN_FAILURES = 5;
export const LOGIN_FAILURE_WINDOW_MS = 10 * 60 * 1000;
export const LOGIN_LOCKOUT_MS = 10 * 60 * 1000;

export const loginRequestSchema = z
  .object({
    email: z.string().trim().email().max(255).transform((email) => email.toLowerCase()),
    password: z.string().min(8).max(128),
  })
  .strict();

export type LoginRequest = ReturnType<typeof loginRequestSchema.parse>;

type LoginResult =
  | { status: "authenticated"; user: Pick<typeof users.$inferSelect, "id" | "name" | "email" | "role">; token: string; expiresAt: string }
  | { status: "invalid" }
  | { status: "locked"; retryAfterSeconds: number };

export function loginAttemptKey(email: string): string {
  return createHmac("sha256", env.SESSION_SECRET)
    .update(email.trim().toLowerCase())
    .digest("hex");
}

export async function getLoginLock(
  accountKey: string,
  now = nowWib()
): Promise<{ retryAfterSeconds: number } | null> {
  const [attempt] = await db
    .select({ lockedUntil: loginAttempts.lockedUntil })
    .from(loginAttempts)
    .where(eq(loginAttempts.accountKey, accountKey))
    .limit(1);

  if (!attempt?.lockedUntil || attempt.lockedUntil <= now) return null;

  return {
    retryAfterSeconds: Math.max(1, Math.ceil((attempt.lockedUntil.getTime() - now.getTime()) / 1000)),
  };
}

export async function recordFailedLogin(
  accountKey: string,
  now = nowWib()
): Promise<{ retryAfterSeconds: number } | null> {
  await db.delete(loginAttempts).where(lt(loginAttempts.updatedAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));

  return db.transaction(async (transaction) => {
    await transaction
      .insert(loginAttempts)
      .values({ accountKey, failedAttempts: 0, windowStartedAt: now, updatedAt: now })
      .onConflictDoNothing({ target: loginAttempts.accountKey });

    const [attempt] = await transaction
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.accountKey, accountKey))
      .for("update");

    if (!attempt) throw new Error("Catatan percobaan login tidak dapat dibuat.");

    if (attempt.lockedUntil && attempt.lockedUntil > now) {
      return {
        retryAfterSeconds: Math.max(1, Math.ceil((attempt.lockedUntil.getTime() - now.getTime()) / 1000)),
      };
    }

    const windowExpired = now.getTime() - attempt.windowStartedAt.getTime() >= LOGIN_FAILURE_WINDOW_MS;
    const failedAttempts = windowExpired ? 1 : attempt.failedAttempts + 1;
    const windowStartedAt = windowExpired ? now : attempt.windowStartedAt;
    const lockedUntil =
      failedAttempts >= MAX_LOGIN_FAILURES ? new Date(now.getTime() + LOGIN_LOCKOUT_MS) : null;

    await transaction
      .update(loginAttempts)
      .set({ failedAttempts, windowStartedAt, lockedUntil, updatedAt: now })
      .where(eq(loginAttempts.accountKey, accountKey));

    return lockedUntil
      ? { retryAfterSeconds: Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000) }
      : null;
  });
}

async function clearFailuresAfterSuccess(accountKey: string, now: Date): Promise<boolean> {
  return db.transaction(async (transaction) => {
    const [attempt] = await transaction
      .select({ lockedUntil: loginAttempts.lockedUntil })
      .from(loginAttempts)
      .where(eq(loginAttempts.accountKey, accountKey))
      .for("update");

    if (attempt?.lockedUntil && attempt.lockedUntil > now) return false;

    await transaction.delete(loginAttempts).where(eq(loginAttempts.accountKey, accountKey));
    return true;
  });
}

export async function authenticate(
  credentials: LoginRequest,
  now = nowWib()
): Promise<LoginResult> {
  const email = credentials.email.trim().toLowerCase();
  const accountKey = loginAttemptKey(email);
  const existingLock = await getLoginLock(accountKey, now);
  if (existingLock) return { status: "locked", ...existingLock };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordMatches = user
    ? await verifyPassword(credentials.password, user.passwordHash)
    : false;

  if (!user) await hashPassword(credentials.password);

  if (!user || !passwordMatches) {
    const lock = await recordFailedLogin(accountKey, now);
    return lock ? { status: "locked", ...lock } : { status: "invalid" };
  }

  if (!(await clearFailuresAfterSuccess(accountKey, now))) {
    const lock = await getLoginLock(accountKey, now);
    return { status: "locked", retryAfterSeconds: lock?.retryAfterSeconds ?? 1 };
  }

  const sessionId = randomUUID();
  const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TIMEOUT_SECONDS * 1000).toISOString();
  const sessionPayload: AuthSessionPayload = {
    userId: user.id,
    role: user.role,
    sessionId,
    expiresAt,
  };
  const token = await createSessionToken(sessionPayload, now.getTime());
  const tokenHash = await hashSessionId(sessionId);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    tokenHash,
    expiresAt: new Date(expiresAt),
  });

  return {
    status: "authenticated",
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
    expiresAt,
  };
}
