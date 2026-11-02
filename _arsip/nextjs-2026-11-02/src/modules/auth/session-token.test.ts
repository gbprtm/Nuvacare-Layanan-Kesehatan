import { describe, expect, it } from "vitest";
import { nowWib } from "@/lib/waktu-wib";
import {
  createSessionToken,
  hashSessionId,
  SESSION_ABSOLUTE_TIMEOUT_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
  sessionCookieOptions,
  verifySessionToken,
} from "./session-token";

const payloadAt = (now: number) => ({
  userId: "123e4567-e89b-12d3-a456-426614174000",
  role: "pasien" as const,
  sessionId: "123e4567-e89b-12d3-a456-426614174001",
  expiresAt: new Date(now + SESSION_ABSOLUTE_TIMEOUT_SECONDS * 1000).toISOString(),
});

describe("token sesi autentikasi", () => {
  it("berlaku 15 menit tanpa aktivitas dan menyimpan batas absolut", async () => {
    const now = nowWib().getTime();
    const token = await createSessionToken(payloadAt(now), now);

    expect(await verifySessionToken(token, now + SESSION_IDLE_TIMEOUT_SECONDS * 1000 - 1000)).not.toBeNull();
    expect(await verifySessionToken(token, now + SESSION_IDLE_TIMEOUT_SECONDS * 1000 + 1000)).toBeNull();
  });

  it("mengizinkan perpanjangan aktivitas selama masa absolut belum habis", async () => {
    const now = nowWib().getTime();
    const payload = payloadAt(now);
    const refreshedAt = now + 14 * 60 * 1000;
    const refreshedToken = await createSessionToken(payload, refreshedAt);

    expect(await verifySessionToken(refreshedToken, refreshedAt + 14 * 60 * 1000)).not.toBeNull();
    expect(await verifySessionToken(refreshedToken, refreshedAt + 16 * 60 * 1000)).toBeNull();
  });

  it("membatasi umur cookie sampai masa sesi absolut", () => {
    const now = nowWib().getTime();
    const options = sessionCookieOptions(
      new Date(now + 5 * 60 * 1000).toISOString(),
      now
    );

    expect(options.maxAge).toBe(5 * 60);
    expect(options.httpOnly).toBe(true);
  });

  it("menghasilkan fingerprint sesi SHA-256 yang stabil dan bukan nilai mentah", async () => {
    const sessionId = "123e4567-e89b-12d3-a456-426614174001";
    const firstHash = await hashSessionId(sessionId);

    expect(firstHash).toHaveLength(64);
    expect(firstHash).not.toBe(sessionId);
    expect(await hashSessionId(sessionId)).toBe(firstHash);
  });
});
