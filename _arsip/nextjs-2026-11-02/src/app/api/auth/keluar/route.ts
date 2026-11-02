import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api";
import { requireAuth } from "@/modules/auth/guard";
import { db } from "@/lib/db";
import { sessions } from "@/db/schema/auth";
import { nowWib } from "@/lib/waktu-wib";
import {
  hashSessionId,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/modules/auth/session-token";


export async function POST(request: Request): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    const session = await requireAuth(incomingRequest);
    const tokenHash = await hashSessionId(session.sessionId);
    await db
      .delete(sessions)
      .where(and(eq(sessions.tokenHash, tokenHash), eq(sessions.userId, session.userId)));

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      "",
      sessionCookieOptions(nowWib().toISOString())
    );
    return response;
  })(request);
}
