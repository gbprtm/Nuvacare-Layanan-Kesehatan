import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  boolean,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { dokter, janji, aturanKontrol } from "./klinik";

// Enum status antrian pemeriksaan klinik sesuai siklus PRD §3.5
export const statusAntrianEnum = pgEnum("status_antrian", [
  "belum_check_in",
  "menunggu",
  "diperiksa",
  "selesai",
  "tidak_hadir",
]);

// Enum status jadwal kontrol berulang
export const statusJadwalKontrolEnum = pgEnum("status_jadwal_kontrol", [
  "terjadwal",
  "selesai",
  "terlewat",
  "dibatalkan",
]);

// Enum jenis kelamin pasien
export const jenisKelaminEnum = pgEnum("jenis_kelamin", [
  "laki_laki",
  "perempuan",
]);

// Enum status penandaan minum obat harian
export const statusMinumObatEnum = pgEnum("status_minum_obat", [
  "sudah",
  "belum",
]);

// Tabel Profil Kesehatan Pasien (FR-01)
export const profil = pgTable(
  "profil",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    nik: varchar("nik", { length: 16 }),
    nomorTelepon: varchar("nomor_telepon", { length: 20 }),
    tanggalLahir: date("tanggal_lahir"),
    jenisKelamin: jenisKelaminEnum("jenis_kelamin"),
    golonganDarah: varchar("golongan_darah", { length: 5 }),
    tinggiBadan: integer("tinggi_badan"), // cm
    beratBadan: integer("berat_badan"), // kg
    kondisiKesehatan: text("kondisi_kesehatan"), // misal: "hipertensi"
    riwayatAlergi: text("riwayat_alergi"),
    kontakDaruratNama: varchar("kontak_darurat_nama", { length: 255 }),
    kontakDaruratTelepon: varchar("kontak_darurat_telepon", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("profil_user_id_idx").on(table.userId),
  ]
);

// Snapshot daftar obat Fornas, bukan tabel resep atau rekomendasi medis.
export const katalogObatFornas = pgTable(
  "katalog_obat_fornas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    namaIndonesia: varchar("nama_indonesia", { length: 255 }).notNull(),
    namaInternasional: varchar("nama_internasional", { length: 255 }),
    kodeResmi: varchar("kode_resmi", { length: 100 }),
    sumber: varchar("sumber", { length: 100 }).notNull().default("fornas"),
    sumberUrl: text("sumber_url").notNull(),
    versiSnapshot: varchar("versi_snapshot", { length: 100 }),
    tanggalSnapshot: date("tanggal_snapshot").notNull(),
    cakupanSnapshot: varchar("cakupan_snapshot", { length: 50 }).notNull(),
    aktif: boolean("aktif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("katalog_obat_fornas_snapshot_nama_idx").on(
      table.sumber,
      table.tanggalSnapshot,
      table.namaIndonesia
    ),
    index("katalog_obat_fornas_nama_idx").on(table.namaIndonesia),
    index("katalog_obat_fornas_kode_resmi_idx").on(table.kodeResmi),
  ]
);

// Catatan obat yang dilaporkan pasien, bukan resep atau rekomendasi medis.
export const obatPasien = pgTable(
  "obat_pasien",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pasienId: uuid("pasien_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    katalogObatFornasId: uuid("katalog_obat_fornas_id").references(
      () => katalogObatFornas.id,
      { onDelete: "set null" }
    ),
    namaObat: varchar("nama_obat", { length: 255 }).notNull(),
    namaInternasional: varchar("nama_internasional", { length: 255 }),
    dosisCatatan: varchar("dosis_catatan", { length: 100 }),
    frekuensiCatatan: varchar("frekuensi_catatan", { length: 100 }),
    mulaiPada: date("mulai_pada"),
    selesaiPada: date("selesai_pada"),
    catatan: text("catatan"),
    sumber: varchar("sumber", { length: 50 }).notNull().default("dilaporkan_pasien"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("obat_pasien_pasien_id_idx").on(table.pasienId),
    index("obat_pasien_katalog_id_idx").on(table.katalogObatFornasId),
  ]
);

// Tabel Jadwal Kontrol Berulang (FR-02)
export const jadwalKontrol = pgTable(
  "jadwal_kontrol",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pasienId: uuid("pasien_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    aturanKontrolId: uuid("aturan_kontrol_id").references(
      () => aturanKontrol.id,
      { onDelete: "set null" }
    ),
    dokterId: uuid("dokter_id").references(() => dokter.id, {
      onDelete: "set null",
    }),
    tanggalRencana: date("tanggal_rencana").notNull(),
    status: statusJadwalKontrolEnum("status").default("terjadwal").notNull(),
    janjiId: uuid("janji_id").references(() => janji.id, {
      onDelete: "set null",
    }),
    catatan: text("catatan"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("jadwal_kontrol_pasien_idx").on(table.pasienId),
    index("jadwal_kontrol_tanggal_idx").on(table.tanggalRencana),
    index("jadwal_kontrol_status_idx").on(table.status),
  ]
);

// Tabel Tiket Antrian Pasien (FR-04, siklus PRD §3.5)
// Catatan PRD: nomor estimasi adalah nilai turunan saat runtime, bukan disimpan di kolom tabel.
export const tiketAntrian = pgTable(
  "tiket_antrian",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    janjiId: uuid("janji_id")
      .notNull()
      .unique()
      .references(() => janji.id, { onDelete: "cascade" }),
    pasienId: uuid("pasien_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tanggal: date("tanggal").notNull(),
    nomorAntrianFinal: integer("nomor_antrian_final"), // Hanya terbit saat check-in
    status: statusAntrianEnum("status").default("belum_check_in").notNull(),
    waktuCheckIn: timestamp("waktu_check_in", { withTimezone: true }),
    waktuPanggil: timestamp("waktu_panggil", { withTimezone: true }),
    waktuSelesai: timestamp("waktu_selesai", { withTimezone: true }),
    alasanKoreksi: text("alasan_koreksi"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tiket_antrian_pasien_idx").on(table.pasienId),
    index("tiket_antrian_tanggal_idx").on(table.tanggal),
    index("tiket_antrian_status_idx").on(table.status),
    uniqueIndex("tiket_antrian_tanggal_nomor_final_unique_idx")
      .on(table.tanggal, table.nomorAntrianFinal)
      .where(sql`${table.nomorAntrianFinal} IS NOT NULL`),
  ]
);

// Tabel Catatan Kebiasaan Harian Pasien (FR-05)
export const catatanKebiasaan = pgTable(
  "catatan_kebiasaan",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pasienId: uuid("pasien_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tanggal: date("tanggal").notNull(),
    hidrasiMl: integer("hidrasi_ml"), // mililiter
    jamTidur: integer("jam_tidur"), // jam (validasi rentang 1-23)
    aktivitasMenit: integer("aktivitas_menit"), // menit
    catatan: text("catatan"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("catatan_kebiasaan_pasien_idx").on(table.pasienId),
    index("catatan_kebiasaan_tanggal_idx").on(table.tanggal),
  ]
);

// Tabel Resep Dokter (FR-12, dicatat admin sesuai anjuran dokter)
export const resep = pgTable(
  "resep",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pasienId: uuid("pasien_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    janjiId: uuid("janji_id").references(() => janji.id, {
      onDelete: "set null",
    }),
    dokterId: uuid("dokter_id").references(() => dokter.id, {
      onDelete: "set null",
    }),
    nomorResep: varchar("nomor_resep", { length: 100 }),
    diagnosis: text("diagnosis"),
    catatan: text("catatan"),
    dibuatOleh: uuid("dibuat_oleh")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tanggalResep: date("tanggal_resep").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("resep_pasien_idx").on(table.pasienId),
    index("resep_tanggal_idx").on(table.tanggalResep),
  ]
);

// Tabel Obat dalam Resep (FR-12)
export const obat = pgTable(
  "obat",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resepId: uuid("resep_id")
      .notNull()
      .references(() => resep.id, { onDelete: "cascade" }),
    namaObat: varchar("nama_obat", { length: 255 }).notNull(),
    dosis: varchar("dosis", { length: 100 }).notNull(), // contoh: "500 mg"
    aturanPakai: varchar("aturan_pakai", { length: 100 }).notNull(), // contoh: "3x1 sesudah makan"
    frekuensiPerHari: integer("frekuensi_per_hari").default(1).notNull(),
    tanggalMulai: date("tanggal_mulai").notNull(),
    tanggalSelesai: date("tanggal_selesai").notNull(),
    rujukanFornas: varchar("rujukan_fornas", { length: 255 }), // Rujukan Formularium Nasional
    keterangan: text("keterangan"),
    aktif: boolean("aktif").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("obat_resep_idx").on(table.resepId),
    index("obat_aktif_idx").on(table.aktif),
  ]
);

// Tabel Catatan Minum Obat Harian (FR-12)
// Constraint unik: satu catatan per pasien, per obat, per tanggal (PRD §6)
export const catatanMinumObat = pgTable(
  "catatan_minum_obat",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pasienId: uuid("pasien_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    obatId: uuid("obat_id")
      .notNull()
      .references(() => obat.id, { onDelete: "cascade" }),
    tanggal: date("tanggal").notNull(),
    status: statusMinumObatEnum("status").default("sudah").notNull(),
    waktuMinum: timestamp("waktu_minum", { withTimezone: true }),
    catatan: text("catatan"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("catatan_minum_obat_unique_idx").on(
      table.pasienId,
      table.obatId,
      table.tanggal
    ),
    index("catatan_minum_obat_pasien_tanggal_idx").on(
      table.pasienId,
      table.tanggal
    ),
  ]
);

// Tabel Log Aktivitas Akun Pasien (FR-14, Append-Only)
export const logAktivitas = pgTable(
  "log_aktivitas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jenisAksi: varchar("jenis_aksi", { length: 100 }).notNull(),
    objek: varchar("objek", { length: 100 }).notNull(),
    objekId: varchar("objek_id", { length: 100 }),
    keterangan: text("keterangan").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("log_aktivitas_user_idx").on(table.userId),
    index("log_aktivitas_created_at_idx").on(table.createdAt),
  ]
);

// Tabel Konten Edukasi Statis (FR-06)
export const kontenStatis = pgTable(
  "konten_statis",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 150 }).notNull().unique(),
    judul: varchar("judul", { length: 255 }).notNull(),
    ringkasan: text("ringkasan").notNull(),
    isi: text("isi").notNull(),
    kategori: varchar("kategori", { length: 100 }).notNull(),
    kondisiTerkait: varchar("kondisi_terkait", { length: 100 }),
    urlSumber: varchar("url_sumber", { length: 500 }).notNull(),
    tanggalPengambilan: date("tanggal_pengambilan").notNull(),
    aktif: boolean("aktif").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("konten_kategori_idx").on(table.kategori),
    index("konten_kondisi_terkait_idx").on(table.kondisiTerkait),
  ]
);

// Type inference
export type Profil = typeof profil.$inferSelect;
export type NewProfil = typeof profil.$inferInsert;
export type JadwalKontrol = typeof jadwalKontrol.$inferSelect;
export type NewJadwalKontrol = typeof jadwalKontrol.$inferInsert;
export type TiketAntrian = typeof tiketAntrian.$inferSelect;
export type NewTiketAntrian = typeof tiketAntrian.$inferInsert;
export type CatatanKebiasaan = typeof catatanKebiasaan.$inferSelect;
export type NewCatatanKebiasaan = typeof catatanKebiasaan.$inferInsert;
export type Resep = typeof resep.$inferSelect;
export type NewResep = typeof resep.$inferInsert;
export type Obat = typeof obat.$inferSelect;
export type NewObat = typeof obat.$inferInsert;
export type CatatanMinumObat = typeof catatanMinumObat.$inferSelect;
export type NewCatatanMinumObat = typeof catatanMinumObat.$inferInsert;
export type LogAktivitas = typeof logAktivitas.$inferSelect;
export type NewLogAktivitas = typeof logAktivitas.$inferInsert;
export type KontenStatis = typeof kontenStatis.$inferSelect;
export type NewKontenStatis = typeof kontenStatis.$inferInsert;
