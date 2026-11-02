import { describe, it } from "vitest";

// Kerangka uji integrasi untuk D01. Sebelumnya berkas ini hanya menguji array
// literal, bukan perilaku transisi status di database.
describe("Uji Integrasi: Transisi Status Antrian Klinik", () => {
  it.todo("mengikuti urutan belum_check_in -> menunggu -> diperiksa -> selesai");
  it.todo("menolak lompatan status, misalnya belum_check_in -> selesai");
});
