import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/masuk/route";

describe("POST /api/auth/masuk", () => {
  it("menolak payload yang tidak memenuhi skema tanpa mencoba autentikasi", async () => {
    const request = new Request("http://localhost/api/auth/masuk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bukan-email", password: "pendek" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as {
      error: { code: string; fields?: Record<string, string[]> };
    };

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields?.email).toBeDefined();
    expect(body.error.fields?.password).toBeDefined();
  });

  it("menolak properti ekstra pada payload login", async () => {
    const request = new Request("http://localhost/api/auth/masuk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "pasien@example.test", password: "kata-sandi-valid", role: "admin" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(422);
  });
});
