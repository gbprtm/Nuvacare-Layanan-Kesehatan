import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import {
  ApiErrorResponse,
  conflictResponse,
  errorResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  unprocessableEntityResponse,
} from "@/lib/http";

export * from "@/lib/http";

/**
 * Memetakan ZodError menjadi Record berisi daftar pesan galat per nama field.
 * Contoh keluaran: { "email": ["Email tidak valid"], "password": ["Minimal 8 karakter"] }
 */
export function mapZodErrorToFields(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const fieldKey = issue.path.length > 0 ? issue.path.join(".") : "_root";

    if (!fields[fieldKey]) {
      fields[fieldKey] = [];
    }
    fields[fieldKey].push(issue.message);
  }

  return fields;
}

/**
 * Format struktur galat standar yang dihasilkan dari ZodError.
 */
export function formatZodError(
  error: ZodError,
  message = "Validasi data gagal"
): { code: string; message: string; fields: Record<string, string[]> } {
  return {
    code: "VALIDATION_ERROR",
    message,
    fields: mapZodErrorToFields(error),
  };
}

/**
 * Helper pembuat respons 422 langsung dari ZodError.
 */
export function zodErrorResponse(
  error: ZodError,
  message = "Validasi data yang dikirim tidak berhasil."
): NextResponse<ApiErrorResponse> {
  const fields = mapZodErrorToFields(error);
  return unprocessableEntityResponse(message, fields);
}

/**
 * Normalisasi objek detail galat menjadi Record<string, string[]> jika memungkinkan.
 */
function normalizeFields(details: unknown): Record<string, string[]> | undefined {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return undefined;
  }

  const result: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(details as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      result[key] = val.map((v) => String(v));
    } else if (typeof val === "string") {
      result[key] = [val];
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Menangani galat pada Route Handler API dan menghasilkan NextResponse terstruktur.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ZodError) {
    return zodErrorResponse(error);
  }

  if (error instanceof ValidationError) {
    const fields = normalizeFields(error.details);
    return unprocessableEntityResponse(error.message, fields, error.code);
  }

  if (error instanceof AuthenticationError) {
    return unauthorizedResponse(error.message, error.code);
  }

  if (error instanceof AuthorizationError) {
    return forbiddenResponse(error.message, error.code);
  }

  if (error instanceof NotFoundError) {
    return notFoundResponse(error.message, error.code);
  }

  if (error instanceof ConflictError) {
    return conflictResponse(error.message, error.code);
  }

  if (error instanceof AppError) {
    const fields = normalizeFields(error.details);
    return errorResponse(error.message, error.code, error.statusCode, fields);
  }

  if (error instanceof Error) {
    // Pada mode non-produksi atau galat umum tak terduga
    return internalErrorResponse("Terjadi kesalahan internal server.");
  }

  return internalErrorResponse("Terjadi kesalahan yang tidak diharapkan.");
}

/**
 * Tipe Route Handler untuk Next.js App Router API.
 */
export type ApiRouteHandler<TContext = unknown> = (
  request: Request,
  context?: TContext
) => Promise<Response> | Response;

/**
 * Higher-order function untuk membungkus Route Handler Next.js dengan penanganan galat terpadu.
 */
export function withErrorHandler<TContext = unknown>(
  handler: ApiRouteHandler<TContext>
): ApiRouteHandler<TContext> {
  return async (request: Request, context?: TContext) => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  };
}
