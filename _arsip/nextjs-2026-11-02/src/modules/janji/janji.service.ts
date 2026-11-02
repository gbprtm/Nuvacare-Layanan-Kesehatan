import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { AppError, AuthorizationError, ConflictError, NotFoundError } from "@/lib/errors";
import { nowWib } from "@/lib/waktu-wib";
import { dokter, janji, slot } from "@/db/schema/klinik";
import { findJanjiById, listAvailableSlots, listJanji } from "./janji.repository";
import type { BatalkanJanjiInput, BuatJanjiInput, JanjiQuery, SlotQuery } from "./janji.schema";

export async function getAvailableSlots(query: SlotQuery) {
  const rows = await listAvailableSlots(query);
  return rows.map(({ slot: slotRow, dokter: dokterRow }) => ({
    id: slotRow.id,
    tanggal: slotRow.tanggal,
    jamMulai: slotRow.jamMulai,
    jamSelesai: slotRow.jamSelesai,
    kuota: slotRow.kuota,
    statusKetersediaan: "tersedia" as const,
    dokter: {
      id: dokterRow.id,
      nama: dokterRow.nama,
      spesialisasi: dokterRow.spesialisasi,
    },
  }));
}

export async function createAppointment(userId: string, input: BuatJanjiInput) {
  const created = await db.transaction(async (transaction) => {
    const [selectedSlot] = await transaction
      .select({ slot, dokter })
      .from(slot)
      .innerJoin(dokter, eq(slot.dokterId, dokter.id))
      .where(and(eq(slot.id, input.slotId), eq(slot.tersedia, true), eq(dokter.aktif, true)))
      .limit(1);

    if (!selectedSlot) throw new NotFoundError("Slot praktik tidak ditemukan atau tidak tersedia.");

    try {
      const [appointment] = await transaction
        .insert(janji)
        .values({
          pasienId: userId,
          dokterId: selectedSlot.dokter.id,
          slotId: selectedSlot.slot.id,
          keluhan: input.keluhan,
          status: "aktif",
        })
        .returning({ id: janji.id });
      if (!appointment) throw new AppError("Janji tidak dapat dibuat.", "APPOINTMENT_CREATE_FAILED", 500);
      return appointment;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(
          "Slot praktik baru saja diambil pasien lain.",
          "SLOT_ALREADY_BOOKED",
          409
        );
      }
      throw error;
    }
  });

  const result = await findJanjiById(created.id);
  if (!result) throw new AppError("Janji tidak dapat dibaca kembali.", "APPOINTMENT_READ_FAILED", 500);
  return formatAppointment(result);
}

export async function getAppointments(query: JanjiQuery, userId: string, isAdmin: boolean) {
  const rows = await listJanji(query, userId, isAdmin);
  return rows.map(formatAppointment);
}

export async function cancelAppointment(
  janjiId: string,
  userId: string,
  isAdmin: boolean,
  input: BatalkanJanjiInput
) {
  const current = await findJanjiById(janjiId);
  if (!current) throw new NotFoundError("Janji tidak ditemukan.");
  if (!isAdmin && current.janji.pasienId !== userId) {
    throw new AuthorizationError("Anda tidak dapat membatalkan janji pasien lain.");
  }
  if (current.janji.status !== "aktif") {
    throw new ConflictError("Janji ini tidak lagi aktif dan tidak dapat dibatalkan.");
  }

  const [updated] = await db
    .update(janji)
    .set({
      status: "dibatalkan",
      alasanBatal: input.alasan,
      dibatalkanOleh: userId,
      updatedAt: nowWib(),
    })
    .where(and(eq(janji.id, janjiId), eq(janji.status, "aktif")))
    .returning({ id: janji.id });

  if (!updated) throw new ConflictError("Janji sudah berubah atau dibatalkan.");
  const result = await findJanjiById(updated.id);
  if (!result) throw new AppError("Janji tidak dapat dibaca kembali.", "APPOINTMENT_READ_FAILED", 500);
  return formatAppointment(result);
}

function formatAppointment(row: Awaited<ReturnType<typeof findJanjiById>>) {
  if (!row) throw new AppError("Janji tidak ditemukan.", "APPOINTMENT_READ_FAILED", 500);
  return {
    id: row.janji.id,
    status: row.janji.status,
    keluhan: row.janji.keluhan,
    alasanBatal: row.janji.alasanBatal,
    createdAt: row.janji.createdAt.toISOString(),
    updatedAt: row.janji.updatedAt.toISOString(),
    slot: {
      id: row.slot.id,
      tanggal: row.slot.tanggal,
      jamMulai: row.slot.jamMulai,
      jamSelesai: row.slot.jamSelesai,
    },
    dokter: {
      id: row.dokter.id,
      nama: row.dokter.nama,
      spesialisasi: row.dokter.spesialisasi,
    },
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: string; cause?: unknown };
  return candidate.code === "23505" || isUniqueViolation(candidate.cause);
}
