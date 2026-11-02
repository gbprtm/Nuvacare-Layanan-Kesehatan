import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_ABSOLUTE_TIMEOUT_SECONDS } from "@/modules/auth/session-token";
import { nowWib } from "@/lib/waktu-wib";

const createPatientToken = (now: number) =>
  createSessionToken(
    {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      role: "pasien",
      sessionId: "123e4567-e89b-12d3-a456-426614174001",
      expiresAt: new Date(now + SESSION_ABSOLUTE_TIMEOUT_SECONDS * 1000).toISOString(),
    },
    now
  );

function requestWithToken(path: string, token: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

describe("Proxy autentikasi API", () => {
  it("meneruskan login publik tanpa cookie ke route handler", async () => {
    const response = await proxy(
      new NextRequest("http://localhost/api/auth/masuk", { method: "POST" })
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("meneruskan API terlindungi agar handler mengembalikan JSON 401", async () => {
    const response = await proxy(new NextRequest("http://localhost/api/profil"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("tetap mengarahkan tamu dari halaman inti ke halaman masuk", async () => {
    const response = await proxy(new NextRequest("http://localhost/profil"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/masuk?redirect=%2Fprofil");
  });

  it("menyerahkan otorisasi API admin kepada handler", async () => {
    const token = await createPatientToken(nowWib().getTime());
    const response = await proxy(requestWithToken("/api/admin/audit", token));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("membatasi proxy pada pemeriksaan awal tanpa memperpanjang token", async () => {
    const token = await createPatientToken(nowWib().getTime());
    const response = await proxy(requestWithToken("/profil", token));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("mengarahkan token yang sudah melewati idle timeout ke halaman masuk", async () => {
    const now = nowWib().getTime();
    const token = await createPatientToken(now - 16 * 60 * 1000);
    const response = await proxy(requestWithToken("/profil", token));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/masuk");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
