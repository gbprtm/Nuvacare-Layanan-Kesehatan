import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  unprocessableEntityResponse,
  internalErrorResponse,
  HttpStatus,
} from "./http";
import {
  mapZodErrorToFields,
  formatZodError,
  zodErrorResponse,
  handleApiError,
  withErrorHandler,
} from "./api";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
  AppError,
} from "./errors";

describe("HTTP Response Helpers", () => {
  it("harus membuat respons 200 OK dengan format { data }", async () => {
    const res = successResponse({ id: 1, name: "IPL Klinik" });
    assert.equal(res.status, HttpStatus.OK);
    const body = await res.json();
    assert.deepEqual(body, {
      data: { id: 1, name: "IPL Klinik" },
    });
  });

  it("harus membuat respons 201 Created dengan format { data }", async () => {
    const res = createdResponse({ id: 99, status: "created" });
    assert.equal(res.status, HttpStatus.CREATED);
    const body = await res.json();
    assert.deepEqual(body, {
      data: { id: 99, status: "created" },
    });
  });

  it("harus membuat respons galat terstruktur { error: { code, message, fields? } }", async () => {
    const res = errorResponse("Terjadi galat permintaan", "BAD_REQUEST", 400);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.deepEqual(body, {
      error: {
        code: "BAD_REQUEST",
        message: "Terjadi galat permintaan",
      },
    });
  });

  it("harus menghasilkan helper 401 Unauthorized yang benar", async () => {
    const res = unauthorizedResponse();
    assert.equal(res.status, HttpStatus.UNAUTHORIZED);
    const body = await res.json();
    assert.equal(body.error.code, "UNAUTHORIZED");
    assert.ok(body.error.message.length > 0);
  });

  it("harus menghasilkan helper 403 Forbidden yang benar", async () => {
    const res = forbiddenResponse();
    assert.equal(res.status, HttpStatus.FORBIDDEN);
    const body = await res.json();
    assert.equal(body.error.code, "FORBIDDEN");
    assert.ok(body.error.message.length > 0);
  });

  it("harus menghasilkan helper 404 Not Found yang benar", async () => {
    const res = notFoundResponse("Pasien tidak ditemukan");
    assert.equal(res.status, HttpStatus.NOT_FOUND);
    const body = await res.json();
    assert.equal(body.error.code, "NOT_FOUND");
    assert.equal(body.error.message, "Pasien tidak ditemukan");
  });

  it("harus menghasilkan helper 409 Conflict yang benar", async () => {
    const res = conflictResponse("Slot janji telah diambil");
    assert.equal(res.status, HttpStatus.CONFLICT);
    const body = await res.json();
    assert.equal(body.error.code, "CONFLICT");
    assert.equal(body.error.message, "Slot janji telah diambil");
  });

  it("harus menghasilkan helper 422 Unprocessable Entity dengan fields", async () => {
    const res = unprocessableEntityResponse("Formulir tidak lengkap", {
      nama: ["Nama wajib diisi"],
    });
    assert.equal(res.status, HttpStatus.UNPROCESSABLE_ENTITY);
    const body = await res.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.deepEqual(body.error.fields, { nama: ["Nama wajib diisi"] });
  });

  it("harus menghasilkan helper 500 Internal Server Error yang benar", async () => {
    const res = internalErrorResponse();
    assert.equal(res.status, HttpStatus.INTERNAL_SERVER_ERROR);
    const body = await res.json();
    assert.equal(body.error.code, "INTERNAL_ERROR");
  });
});

describe("API Error Mapping & Zod Integration", () => {
  const testSchema = z.object({
    email: z.string().email("Format email salah"),
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    nested: z.object({
      age: z.number().min(1, "Usia minimal 1"),
    }),
  });

  it("harus memetakan ZodError ke fields dictionary secara akurat", () => {
    const parsed = testSchema.safeParse({
      email: "invalid-email",
      password: "123",
      nested: { age: 0 },
    });

    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const fields = mapZodErrorToFields(parsed.error);
      assert.ok(Array.isArray(fields.email));
      assert.ok(fields.email.includes("Format email salah"));
      assert.ok(Array.isArray(fields.password));
      assert.ok(fields.password.includes("Kata sandi minimal 8 karakter"));
      assert.ok(Array.isArray(fields["nested.age"]));
      assert.ok(fields["nested.age"].includes("Usia minimal 1"));
    }
  });

  it("harus memformat ZodError dengan struktur { code, message, fields }", () => {
    const parsed = testSchema.safeParse({ email: "salah" });
    assert.equal(parsed.success, false);

    if (!parsed.success) {
      const formatted = formatZodError(parsed.error, "Input tidak valid");
      assert.equal(formatted.code, "VALIDATION_ERROR");
      assert.equal(formatted.message, "Input tidak valid");
      assert.ok(formatted.fields.email);
    }
  });

  it("harus menghasilkan zodErrorResponse dengan status 422 dan field yang salah", async () => {
    const parsed = testSchema.safeParse({ email: "salah" });
    assert.equal(parsed.success, false);

    if (!parsed.success) {
      const res = zodErrorResponse(parsed.error);
      assert.equal(res.status, HttpStatus.UNPROCESSABLE_ENTITY);
      const body = await res.json();
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(body.error.fields?.email);
    }
  });

  it("handleApiError harus menangani ZodError dan mengembalikan 422", async () => {
    const parsed = testSchema.safeParse({});
    assert.equal(parsed.success, false);

    if (!parsed.success) {
      const res = handleApiError(parsed.error);
      assert.equal(res.status, 422);
      const body = await res.json();
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(body.error.fields);
    }
  });

  it("handleApiError harus menangani AuthenticationError dan mengembalikan 401", async () => {
    const res = handleApiError(new AuthenticationError("Token kedaluwarsa"));
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, "UNAUTHORIZED");
    assert.equal(body.error.message, "Token kedaluwarsa");
  });

  it("handleApiError harus menangani AuthorizationError dan mengembalikan 403", async () => {
    const res = handleApiError(new AuthorizationError("Hanya untuk admin"));
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, "FORBIDDEN");
    assert.equal(body.error.message, "Hanya untuk admin");
  });

  it("handleApiError harus menangani NotFoundError dan mengembalikan 404", async () => {
    const res = handleApiError(new NotFoundError("Jadwal dokter tidak ditemukan"));
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, "NOT_FOUND");
    assert.equal(body.error.message, "Jadwal dokter tidak ditemukan");
  });

  it("handleApiError harus menangani ConflictError dan mengembalikan 409", async () => {
    const res = handleApiError(new ConflictError("Nomor antrian sudah diambil"));
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, "CONFLICT");
    assert.equal(body.error.message, "Nomor antrian sudah diambil");
  });

  it("handleApiError harus menangani ValidationError dan mengembalikan 422", async () => {
    const res = handleApiError(
      new ValidationError("Data tidak sesuai", { nik: ["NIK harus 16 digit"] })
    );
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.deepEqual(body.error.fields, { nik: ["NIK harus 16 digit"] });
  });

  it("handleApiError harus menangani AppError kustom dan mengembalikan status code sesuai", async () => {
    const customErr = new AppError("Kustom galat", "CUSTOM_CODE", 418);
    const res = handleApiError(customErr);
    assert.equal(res.status, 418);
    const body = await res.json();
    assert.equal(body.error.code, "CUSTOM_CODE");
    assert.equal(body.error.message, "Kustom galat");
  });

  it("handleApiError harus menangani Error umum dan mengembalikan 500", async () => {
    const res = handleApiError(new Error("Database connection lost"));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error.code, "INTERNAL_ERROR");
  });
});

describe("withErrorHandler Wrapper", () => {
  it("harus meneruskan respons sukses saat handler tidak melempar galat", async () => {
    const wrappedHandler = withErrorHandler(async () => {
      return successResponse({ ok: true });
    });

    const res = await wrappedHandler(new Request("http://localhost/api/test"));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { data: { ok: true } });
  });

  it("harus menangkap galat yang dilempar handler dan mengubahnya menjadi respons galat terstruktur", async () => {
    const wrappedHandler = withErrorHandler(async () => {
      throw new AuthenticationError("Akses ditolak: belum masuk");
    });

    const res = await wrappedHandler(new Request("http://localhost/api/test"));
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, "UNAUTHORIZED");
    assert.equal(body.error.message, "Akses ditolak: belum masuk");
  });
});
