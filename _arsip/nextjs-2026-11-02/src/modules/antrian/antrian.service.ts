import { UpdateStatusAntrianInput } from "./antrian.schema";
import { UserSessionPayload, canUpdateQueueStatus } from "./antrian.policy";
import { findTicketById } from "./antrian.repository";

export async function updateQueueStatusService(
  user: UserSessionPayload,
  data: UpdateStatusAntrianInput
) {
  if (!canUpdateQueueStatus(user)) {
    throw new Error("Hanya admin atau staf klinik yang dapat memperbarui status antrian");
  }

  const ticket = await findTicketById(data.tiketId);
  if (!ticket) {
    throw new Error("Tiket antrian tidak ditemukan");
  }

  return { success: true, tiketId: data.tiketId, status: data.status };
}

