import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/masuk/route";
import { POST as logout } from "@/app/api/auth/keluar/route";
import { GET as me } from "@/app/api/auth/saya/route";
import { successResponse, withErrorHandler } from "@/lib/api";
import { client, db } from "@/lib/db";
import { loginAttempts, sessions, users } from "@/db/schema/auth";
import { hashPassword } from "@/modules/auth/password";
import { loginAttemptKey, recordFailedLogin } from "@/modules/auth/login.service";
import { requireAuth, requireRole } from "@/modules/auth/guard";
import { nowWib } from "@/lib/waktu-wib";
import {
  attachRefreshedSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/modules/auth/session-token";

const suffix = randomUUID();
const validEmail = `b01.auth.${suffix}@example.test`;
const limitedEmail = `b01.limit.${suffix}@example.test`;
const unknownEmail = `unknown.${suffix}@example.test`;
const password = "kata-sandi-uji-aman-123";
let validUserId: string | undefined;
let limitedUserId: string | undefined;

const request = (url: string, init?: RequestInit) => new Request(url, init);

async function loginRequest(email: string, candidatePassword: string): Promise<Response> {
  return login(
    request("http://localhost/api/auth/masuk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: candidatePassword }),
    })
  );
}

function cookieFrom(response: Response): string {
  const cookiePair = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  const token = cookiePair.startsWith(`${SESSION_COOKIE_NAME}=`)
    ? cookiePair.slice(SESSION_COOKIE_NAME.length + 1)
    : "";
  if (!token) throw new Error("Cookie sesi tidak ditemukan pada respons login.");
  return `${SESSION_COOKIE_NAME}=${token}`;
}

beforeAll(async () => {
  const passwordHash = await hashPassword(password);
  const [validUser] = await db
    .insert(users)
    .values({ name: "Pasien Uji B01", email: validEmail, passwordHash, role: "pasien" })
    .returning({ id: users.id });
  const [limitedUser] = await db
    .insert(users)
    .values({ name: "Pasien Limit B01", email: limitedEmail, passwordHash, role: "pasien" })
    .returning({ id: users.id });

  if (!validUser || !limitedUser) throw new Error("Fixture pasien B01 gagal dibuat.");

  validUserId = validUser.id;
  limitedUserId = limitedUser.id;
});

afterAll(async () => {
  await db.delete(loginAttempts).where(eq(loginAttempts.accountKey, loginAttemptKey(validEmail)));
  await db.delete(loginAttempts).where(eq(loginAttempts.accountKey, loginAttemptKey(limitedEmail)));
  await db.delete(loginAttempts).where(eq(loginAttempts.accountKey, loginAttemptKey(unknownEmail)));
  if (validUserId) await db.delete(sessions).where(eq(sessions.userId, validUserId));
  if (limitedUserId) await db.delete(sessions).where(eq(sessions.userId, limitedUserId));
  if (validUserId) await db.delete(users).where(eq(users.id, validUserId));
  if (limitedUserId) await db.delete(users).where(eq(users.id, limitedUserId));
  await client.end({ timeout: 5 });
});

describe("B01 autentikasi dan guard peran dengan PostgreSQL", () => {
  it("menghasilkan JSON 401 bagi tamu pada endpoint identitas", async () => {
    const response = await me(request("http://localhost/api/auth/saya"));
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("SESSION_EXPIRED");
  });

  it("membuat sesi, memeriksa role, dan mencabut token saat logout", async () => {
    const loginResponse = await loginRequest(validEmail, password);
    const cookie = cookieFrom(loginResponse);
    const loginBody = (await loginResponse.json()) as {
      data: { user: { id: string; role: string } };
    };

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers.get("set-cookie")).toContain("HttpOnly");
    expect(loginResponse.headers.get("set-cookie")).toContain("Max-Age=900");
    expect(loginBody.data.user.id).toBe(validUserId);
    expect(loginBody.data.user.role).toBe("pasien");

    const identityResponse = await me(
      request("http://localhost/api/auth/saya", { headers: { cookie } })
    );
    expect(identityResponse.status).toBe(200);
    expect(identityResponse.headers.get("set-cookie")).toContain("Max-Age=900");

    const adminHandler = withErrorHandler(async (incomingRequest) => {
      const session = await requireRole(incomingRequest, "admin");
      const response = successResponse({ access: true });
      return attachRefreshedSessionCookie(response, session);
    });
    const adminResponse = await adminHandler(
      request("http://localhost/api/admin/audit", { headers: { cookie } })
    );
    const adminBody = (await adminResponse.json()) as { error: { code: string } };
    expect(adminResponse.status).toBe(403);
    expect(adminBody.error.code).toBe("FORBIDDEN");
    expect(adminResponse.headers.get("set-cookie")).toBeNull();

    const guestLogoutResponse = await logout(
      request("http://localhost/api/auth/keluar", { method: "POST" })
    );
    expect(guestLogoutResponse.status).toBe(401);

    const logoutResponse = await logout(
      request("http://localhost/api/auth/keluar", { method: "POST", headers: { cookie } })
    );
    expect(logoutResponse.status).toBe(204);
    expect(logoutResponse.headers.get("set-cookie")).toContain("Max-Age=0");

    const revokedResponse = await me(
      request("http://localhost/api/auth/saya", { headers: { cookie } })
    );
    expect(revokedResponse.status).toBe(401);
  });

  it("mengunci akun setelah lima kegagalan dalam jendela sepuluh menit", async () => {
    const outcomes: number[] = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await loginRequest(limitedEmail, "kata-sandi-salah-123");
      outcomes.push(response.status);
    }

    expect(outcomes).toEqual([401, 401, 401, 401, 429]);
    const blockedCorrectPassword = await loginRequest(limitedEmail, password);
    expect(blockedCorrectPassword.status).toBe(429);

    const lockoutEndsAt = new Date(nowWib().getTime() + 10 * 60 * 1000 + 1000);
    const resumedAttempt = await recordFailedLogin(loginAttemptKey(limitedEmail), lockoutEndsAt);
    expect(resumedAttempt).toBeNull();
  });

  it("mengembalikan galat kredensial generik untuk email dikenal dan tidak dikenal", async () => {
    const knownResponse = await loginRequest(validEmail, "kata-sandi-salah-123");
    const unknownResponse = await loginRequest(unknownEmail, "kata-sandi-salah-123");
    const knownBody = (await knownResponse.json()) as { error: { message: string } };
    const unknownBody = (await unknownResponse.json()) as { error: { message: string } };

    expect(knownResponse.status).toBe(401);
    expect(unknownResponse.status).toBe(401);
    expect(knownBody.error.message).toBe(unknownBody.error.message);
  });

  it("menolak JSON rusak sebagai galat validasi", async () => {
    const response = await login(
      request("http://localhost/api/auth/masuk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      })
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("menolak token yang sesi servernya tidak tersedia", async () => {
    const sessionCookie = `${SESSION_COOKIE_NAME}=invalid-token`;
    const handler = withErrorHandler(async (incomingRequest) => {
      await requireAuth(incomingRequest);
      return successResponse({ access: true });
    });
    const response = await handler(
      request("http://localhost/api/protected", { headers: { cookie: sessionCookie } })
    );

    expect(response.status).toBe(401);
  });
});
