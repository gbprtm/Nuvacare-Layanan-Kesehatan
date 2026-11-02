import { successResponse, withErrorHandler } from "@/lib/api";
import { requireRole } from "@/modules/auth/guard";
import { attachRefreshedSessionCookie } from "@/modules/auth/session-token";
import { getAvailableSlots } from "@/modules/janji/janji.service";
import { slotQuerySchema } from "@/modules/janji/janji.schema";

export async function GET(request: Request): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    const session = await requireRole(incomingRequest, ["pasien", "admin"]);
    const url = new URL(incomingRequest.url);
    const query = slotQuerySchema.parse({
      tanggal: url.searchParams.get("tanggal") ?? undefined,
      dokterId: url.searchParams.get("dokterId") ?? undefined,
      spesialisasi: url.searchParams.get("spesialisasi") ?? undefined,
      tersedia: url.searchParams.get("tersedia") ?? undefined,
    });
    const response = successResponse(await getAvailableSlots(query));
    return attachRefreshedSessionCookie(response, session);
  })(request);
}
