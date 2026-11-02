import { describe, it } from "node:test";
import assert from "node:assert";
import { createSessionToken, verifySessionToken } from "./session";

describe("Session Module (jose JWT)", () => {
  it("harus membuat token JWT dan memverifikasi payload dengan benar", async () => {
    const payload = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      role: "pasien" as const,
    };

    const token = await createSessionToken(payload);
    assert.ok(token);
    assert.strictEqual(typeof token, "string");

    const verified = await verifySessionToken(token);
    assert.ok(verified);
    assert.strictEqual(verified?.userId, payload.userId);
    assert.strictEqual(verified?.role, payload.role);
  });

  it("harus mengembalikan null jika token tidak valid atau diubah secara ilegal", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.signature";
    const verified = await verifySessionToken(invalidToken);
    assert.strictEqual(verified, null);
  });
});
