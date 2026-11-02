import { describe, it } from "vitest";

// Kerangka uji integrasi untuk D01. Sebelumnya berkas ini berisi
// `expect(true).toBe(true)` yang selalu hijau tanpa menguji apa pun.
// Diubah menjadi `todo` agar tidak dihitung sebagai bukti sampai transaksi
// database sungguhan ditulis.
describe("Uji Integrasi: Rebutan Slot Dokter (Anti-Bentrok)", () => {
  it.todo("menolak pemesanan kedua jika slot sudah diambil pasien lain");
  it.todo("mengizinkan pemesanan ulang setelah janji pertama dibatalkan");
});
