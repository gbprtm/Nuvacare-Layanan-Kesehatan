import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import { withErrorHandler, successResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { users } from "@/db/schema/auth";
import { requireAuth } from "@/modules/auth/guard";
import { attachRefreshedSessionCookie } from "@/modules/auth/session-token";


export async function GET(request: Request): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    const session = await requireAuth(incomingRequest);
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user || user.role !== session.role) {
      throw new AppError("Sesi Anda telah berakhir atau tidak lagi aktif.", "SESSION_EXPIRED", 401);
    }

    const response = successResponse({
      user: {
        id: user.id,
        nama: user.name,
        email: user.email,
        role: user.role,
      },
    });
    return attachRefreshedSessionCookie(response, session);
  })(request);
}
