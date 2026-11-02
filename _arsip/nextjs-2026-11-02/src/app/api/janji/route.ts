import { createdResponse, successResponse, withErrorHandler } from "@/lib/api";
import { requireRole } from "@/modules/auth/guard";
import { attachRefreshedSessionCookie } from "@/modules/auth/session-token";
import {
  buatJanjiSchema,
  janjiQuerySchema,
} from "@/modules/janji/janji.schema";
import { createAppointment, getAppointments } from "@/modules/janji/janji.service";

export async function GET(request: Request): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    const session = await requireRole(incomingRequest, ["pasien", "admin"]);
    const url = new URL(incomingRequest.url);
    const query = janjiQuerySchema.parse({
      status: url.searchParams.get("status") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });
    const response = successResponse(await getAppointments(query, session.userId, session.role === "admin"));
    return attachRefreshedSessionCookie(response, session);
  })(request);
}

export async function POST(request: Request): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    const session = await requireRole(incomingRequest, "pasien");
    const input = buatJanjiSchema.parse(await incomingRequest.json());
    const response = createdResponse(await createAppointment(session.userId, input));
    return attachRefreshedSessionCookie(response, session);
  })(request);
}
