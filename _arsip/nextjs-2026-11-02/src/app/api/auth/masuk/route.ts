import { errorResponse, successResponse, withErrorHandler } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { authenticate, loginRequestSchema } from "@/modules/auth/login.service";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/modules/auth/session-token";


export async function POST(request: Request): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    let body: unknown;
    try {
      body = await incomingRequest.json();
    } catch {
      throw new ValidationError("Body JSON tidak valid.");
    }
    const input = loginRequestSchema.parse(body);
    const result = await authenticate(input);

    if (result.status === "invalid") {
      return errorResponse(
        "Email atau kata sandi tidak benar.",
        "UNAUTHORIZED",
        401
      );
    }

    if (result.status === "locked") {
      return errorResponse(
        "Terlalu banyak percobaan masuk. Coba kembali setelah masa tunggu berakhir.",
        "TOO_MANY_ATTEMPTS",
        429,
        undefined,
        { headers: { "Retry-After": String(result.retryAfterSeconds) } }
      );
    }

    const response = successResponse({
      user: {
        id: result.user.id,
        nama: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      result.token,
      sessionCookieOptions(result.expiresAt)
    );
    return response;
  })(request);
}
