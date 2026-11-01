import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { AppError, AuthorizationError } from "@/lib/errors";
import { nowWib } from "@/lib/waktu-wib";
import { sessions, users } from "@/db/schema/auth";
import {
  getSessionTokenFromRequest,
  hashSessionId,
  verifySessionToken,
  type AuthSessionPayload,
} from "./session-token";

/**
 * Memastikan pengguna telah terautentikasi (memiliki sesi aktif yang valid).
 * Lempar AuthenticationError (401) jika sesi tidak ditemukan atau tidak valid.
 */
export async function requireAuth(request: Request): Promise<AuthSessionPayload> {
  const token = getSessionTokenFromRequest(request);
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    throw new AppError("Sesi Anda telah berakhir atau belum terautentikasi.", "SESSION_EXPIRED", 401);
  }

  const tokenHash = await hashSessionId(session.sessionId);
  const [storedSession] = await db
    .select({ role: users.role })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        eq(sessions.userId, session.userId),
        gt(sessions.expiresAt, nowWib())
      )
    )
    .limit(1);

  if (!storedSession || storedSession.role !== session.role) {
    throw new AppError("Sesi Anda telah berakhir atau tidak lagi aktif.", "SESSION_EXPIRED", 401);
  }

  return session;
}

/**
 * Memastikan pengguna terautentikasi dan memiliki peran (role) tertentu ('pasien' | 'admin').
 * Lempar AuthorizationError (403) jika peran pengguna tidak sesuai.
 */
export async function requireRole(
  request: Request,
  allowedRoles: ("pasien" | "admin")[] | "pasien" | "admin"
): Promise<AuthSessionPayload> {
  const session = await requireAuth(request);
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.role)) {
    throw new AuthorizationError("Anda tidak memiliki akses ke sumber daya ini.");
  }

  return session;
}
