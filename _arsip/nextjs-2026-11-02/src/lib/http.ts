import { NextResponse } from "next/server";

/**
 * Format struktur respons standar untuk API web-health-ipl-project.
 * Bentuk sukses: { data: T }
 * Bentuk galat: { error: { code: string, message: string, fields?: Record<string, string[]> } }
 */

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

/**
 * Helper untuk membuat respons sukses { data } dengan status HTTP tertentu (default 200 OK).
 */
export function successResponse<T>(
  data: T,
  status: number = HttpStatus.OK,
  init?: ResponseInit
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { data },
    {
      ...init,
      status,
    }
  );
}

/**
 * Helper untuk membuat respons 201 Created dengan data { data }.
 */
export function createdResponse<T>(
  data: T,
  init?: ResponseInit
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, HttpStatus.CREATED, init);
}

/**
 * Helper dasar untuk membuat respons galat terstruktur { error: { code, message, fields? } }.
 */
export function errorResponse(
  message: string,
  code = "BAD_REQUEST",
  status: number = HttpStatus.BAD_REQUEST,
  fields?: Record<string, string[]>,
  init?: ResponseInit
): NextResponse<ApiErrorResponse> {
  const errorPayload: ApiErrorDetail = {
    code,
    message,
    ...(fields && Object.keys(fields).length > 0 ? { fields } : {}),
  };

  return NextResponse.json(
    { error: errorPayload },
    {
      ...init,
      status,
    }
  );
}

/**
 * Helper 401 Unauthorized
 */
export function unauthorizedResponse(
  message = "Autentikasi diperlukan untuk mengakses sumber daya ini.",
  code = "UNAUTHORIZED",
  init?: ResponseInit
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, code, HttpStatus.UNAUTHORIZED, undefined, init);
}

/**
 * Helper 403 Forbidden
 */
export function forbiddenResponse(
  message = "Anda tidak memiliki hak akses untuk tindakan ini.",
  code = "FORBIDDEN",
  init?: ResponseInit
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, code, HttpStatus.FORBIDDEN, undefined, init);
}

/**
 * Helper 404 Not Found
 */
export function notFoundResponse(
  message = "Sumber daya tidak ditemukan.",
  code = "NOT_FOUND",
  init?: ResponseInit
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, code, HttpStatus.NOT_FOUND, undefined, init);
}

/**
 * Helper 409 Conflict
 */
export function conflictResponse(
  message = "Terjadi konflik pada data yang dikirim.",
  code = "CONFLICT",
  init?: ResponseInit
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, code, HttpStatus.CONFLICT, undefined, init);
}

/**
 * Helper 422 Unprocessable Entity (Validasi form / zod)
 */
export function unprocessableEntityResponse(
  message = "Data yang dikirimkan tidak valid.",
  fields?: Record<string, string[]>,
  code = "VALIDATION_ERROR",
  init?: ResponseInit
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, code, HttpStatus.UNPROCESSABLE_ENTITY, fields, init);
}

/**
 * Helper 500 Internal Server Error
 */
export function internalErrorResponse(
  message = "Terjadi kesalahan internal pada server.",
  code = "INTERNAL_ERROR",
  init?: ResponseInit
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, code, HttpStatus.INTERNAL_SERVER_ERROR, undefined, init);
}
