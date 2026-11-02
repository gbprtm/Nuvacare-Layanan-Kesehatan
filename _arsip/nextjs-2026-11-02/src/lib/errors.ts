/**
 * Definisi kelas galat terstruktur untuk aplikasi.
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code = "INTERNAL_ERROR", statusCode = 500, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "CONFIGURATION_ERROR", 500, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 422, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Autentikasi diperlukan untuk mengakses sumber daya ini") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Anda tidak memiliki hak akses untuk tindakan ini") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Sumber daya tidak ditemukan") {
    super(resource, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Terjadi konflik pada data yang dikirim") {
    super(message, "CONFLICT", 409);
  }
}
