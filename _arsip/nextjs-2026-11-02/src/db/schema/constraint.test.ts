import { describe, it, expect } from "vitest";
import { janji, auditLog } from "./klinik";
import { tiketAntrian, catatanMinumObat } from "./pasien";
import { getTableConfig } from "drizzle-orm/pg-core";

describe("Tugas A12: Indeks, Constraint, dan Aturan Append-Only", () => {
  it("harus memiliki partial unique index pada janji aktif per slot", () => {
    const config = getTableConfig(janji);
    const partialIdx = config.indexes.find(
      (idx) => idx.config.name === "janji_slot_aktif_unique_idx"
    );
    expect(partialIdx).toBeDefined();
    expect(partialIdx?.config.unique).toBe(true);
  });

  it("harus memiliki partial unique index pada nomor antrian final per tanggal", () => {
    const config = getTableConfig(tiketAntrian);
    const antrianIdx = config.indexes.find(
      (idx) => idx.config.name === "tiket_antrian_tanggal_nomor_final_unique_idx"
    );
    expect(antrianIdx).toBeDefined();
    expect(antrianIdx?.config.unique).toBe(true);
  });

  it("harus memiliki unique index gabungan catatan minum obat per pasien, obat, dan tanggal", () => {
    const config = getTableConfig(catatanMinumObat);
    const minumIdx = config.indexes.find(
      (idx) => idx.config.name === "catatan_minum_obat_unique_idx"
    );
    expect(minumIdx).toBeDefined();
    expect(minumIdx?.config.unique).toBe(true);
  });

  it("harus bersifat append-only tanpa kolom updated_at pada tabel audit_log", () => {
    const config = getTableConfig(auditLog);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toContain("created_at");
    expect(columnNames).not.toContain("updated_at");
  });
});
