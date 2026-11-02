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
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

// Enum siklus status janji sesuai PRD §3.4
export const statusJanjiEnum = pgEnum("status_janji", [
  "aktif",
  "perubahan_diusulkan",
  "dibatalkan",
  "selesai",
  "tidak_hadir",
]);

// Enum status usulan perubahan janji oleh admin
export const statusUsulanEnum = pgEnum("status_usulan", [
  "menunggu_tanggapan",
  "disetujui",
  "ditolak",
  "kedaluwarsa",
]);

// Enum jenis notifikasi sistem
export const tipeNotifikasiEnum = pgEnum("tipe_notifikasi", [
  "pengingat_janji",
  "usulan_perubahan",
  "pengingat_obat",
  "antrian",
  "sistem",
]);

// Tabel Dokter (data master dokter, tanpa kredensial login)
export const dokter = pgTable(
  "dokter",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nama: varchar("nama", { length: 255 }).notNull(),
    spesialisasi: varchar("spesialisasi", { length: 255 }).notNull(),
    nomorIzin: varchar("nomor_izin", { length: 100 }),
    aktif: boolean("aktif").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("dokter_spesialisasi_idx").on(table.spesialisasi),
    index("dokter_aktif_idx").on(table.aktif),
  ]
);

// Tabel Slot Praktik Dokter
export const slot = pgTable(
  "slot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dokterId: uuid("dokter_id")
      .notNull()
      .references(() => dokter.id, { onDelete: "cascade" }),
    tanggal: date("tanggal").notNull(),
    jamMulai: varchar("jam_mulai", { length: 10 }).notNull(),
    jamSelesai: varchar("jam_selesai", { length: 10 }).notNull(),
    kuota: integer("kuota").default(1).notNull(),
    tersedia: boolean("tersedia").default(true).notNull(),
    dikunciSampai: timestamp("dikunci_sampai", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("slot_dokter_tanggal_idx").on(table.dokterId, table.tanggal),
    index("slot_tersedia_idx").on(table.tersedia),
  ]
);

// Tabel Janji Temu Pasien dan Dokter
export const janji = pgTable(
  "janji",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pasienId: uuid("pasien_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dokterId: uuid("dokter_id")
      .notNull()
      .references(() => dokter.id, { onDelete: "restrict" }),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => slot.id, { onDelete: "restrict" }),
    status: statusJanjiEnum("status").default("aktif").notNull(),
    keluhan: text("keluhan"),
    catatan: text("catatan"),
    alasanBatal: text("alasan_batal"),
    dibatalkanOleh: uuid("dibatalkan_oleh").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("janji_pasien_idx").on(table.pasienId),
    index("janji_dokter_idx").on(table.dokterId),
    index("janji_slot_idx").on(table.slotId),
    index("janji_status_idx").on(table.status),
    uniqueIndex("janji_slot_aktif_unique_idx")
      .on(table.slotId)
      .where(sql`${table.status} = 'aktif'`),
  ]
);

// Tabel Usulan Perubahan Janji oleh Admin
export const usulanPerubahan = pgTable(
  "usulan_perubahan",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    janjiId: uuid("janji_id")
      .notNull()
      .references(() => janji.id, { onDelete: "cascade" }),
    slotBaruId: uuid("slot_baru_id")
      .notNull()
      .references(() => slot.id, { onDelete: "restrict" }),
    alasan: text("alasan").notNull(),
    status: statusUsulanEnum("status").default("menunggu_tanggapan").notNull(),
    batasWaktuJawab: timestamp("batas_waktu_jawab", { withTimezone: true }).notNull(),
    ttlKunciSlot: timestamp("ttl_kunci_slot", { withTimezone: true }).notNull(),
    dibuatOleh: uuid("dibuat_oleh")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("usulan_janji_idx").on(table.janjiId),
    index("usulan_slot_baru_idx").on(table.slotBaruId),
    index("usulan_status_idx").on(table.status),
  ]
);

// Tabel Notifikasi Pengguna
export const notifikasi = pgTable(
  "notifikasi",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    judul: varchar("judul", { length: 255 }).notNull(),
    pesan: text("pesan").notNull(),
    tipe: tipeNotifikasiEnum("tipe").default("sistem").notNull(),
    dibaca: boolean("dibaca").default(false).notNull(),
    dataTerkait: jsonb("data_terkait"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifikasi_user_idx").on(table.userId),
    index("notifikasi_dibaca_idx").on(table.dibaca),
  ]
);

// Tabel Log Audit (Append-Only untuk setiap aksi admin)
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    aksi: varchar("aksi", { length: 100 }).notNull(),
    objek: varchar("objek", { length: 100 }).notNull(),
    objekId: varchar("objek_id", { length: 100 }).notNull(),
    nilaiSebelum: jsonb("nilai_sebelum"),
    nilaiSesudah: jsonb("nilai_sesudah"),
    alasan: text("alasan"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_user_idx").on(table.userId),
    index("audit_objek_idx").on(table.objek, table.objekId),
    index("audit_created_at_idx").on(table.createdAt),
  ]
);

// Tabel Aturan Kontrol Berulang (Dicatat admin sesuai anjuran dokter)
export const aturanKontrol = pgTable(
  "aturan_kontrol",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pasienId: uuid("pasien_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dokterId: uuid("dokter_id").references(() => dokter.id, {
      onDelete: "set null",
    }),
    intervalHari: integer("interval_hari").notNull(),
    tanggalMulai: date("tanggal_mulai").notNull(),
    anchorHari: integer("anchor_hari").notNull(),
    aktif: boolean("aktif").default(true).notNull(),
    catatan: text("catatan"),
    dibuatOleh: uuid("dibuat_oleh")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("aturan_kontrol_pasien_idx").on(table.pasienId),
    index("aturan_kontrol_aktif_idx").on(table.aktif),
  ]
);

// Type inference
export type Dokter = typeof dokter.$inferSelect;
export type NewDokter = typeof dokter.$inferInsert;
export type Slot = typeof slot.$inferSelect;
export type NewSlot = typeof slot.$inferInsert;
export type Janji = typeof janji.$inferSelect;
export type NewJanji = typeof janji.$inferInsert;
export type UsulanPerubahan = typeof usulanPerubahan.$inferSelect;
export type NewUsulanPerubahan = typeof usulanPerubahan.$inferInsert;
export type Notifikasi = typeof notifikasi.$inferSelect;
export type NewNotifikasi = typeof notifikasi.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
export type AturanKontrol = typeof aturanKontrol.$inferSelect;
export type NewAturanKontrol = typeof aturanKontrol.$inferInsert;
