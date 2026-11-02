import { successResponse, withErrorHandler } from "@/lib/api";
import { requireRole } from "@/modules/auth/guard";
import { attachRefreshedSessionCookie } from "@/modules/auth/session-token";
import { batalkanJanjiSchema } from "@/modules/janji/janji.schema";
import { cancelAppointment } from "@/modules/janji/janji.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    const session = await requireRole(incomingRequest, ["pasien", "admin"]);
    const { id } = await context.params;
    const input = batalkanJanjiSchema.parse(await incomingRequest.json());
    const response = successResponse(
      await cancelAppointment(id, session.userId, session.role === "admin", input)
    );
    return attachRefreshedSessionCookie(response, session);
  })(request);
}
