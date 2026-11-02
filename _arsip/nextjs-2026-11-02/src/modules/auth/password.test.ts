import { describe, it } from "node:test";
import assert from "node:assert";
import { hashPassword, verifyPassword } from "./password";

describe("Password Module (bcryptjs)", () => {
  it("harus merubah kata sandi biasa menjadi hash dan berhasil memverifikasinya", async () => {
    const rawPassword = "rahasiaSuperSafe123!";
    const hash = await hashPassword(rawPassword);

    assert.notStrictEqual(hash, rawPassword);
    assert.ok(hash.length > 20);

    const isValid = await verifyPassword(rawPassword, hash);
    assert.strictEqual(isValid, true);

    const isInvalid = await verifyPassword("salahPassword123", hash);
    assert.strictEqual(isInvalid, false);
  });
});
