CREATE TYPE "public"."status_janji" AS ENUM('aktif', 'perubahan_diusulkan', 'dibatalkan', 'selesai', 'tidak_hadir');--> statement-breakpoint
CREATE TYPE "public"."status_usulan" AS ENUM('menunggu_tanggapan', 'disetujui', 'ditolak', 'kedaluwarsa');--> statement-breakpoint
CREATE TYPE "public"."tipe_notifikasi" AS ENUM('pengingat_janji', 'usulan_perubahan', 'pengingat_obat', 'antrian', 'sistem');--> statement-breakpoint
CREATE TABLE "aturan_kontrol" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pasien_id" uuid NOT NULL,
	"dokter_id" uuid,
	"interval_hari" integer NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"anchor_hari" integer NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"catatan" text,
	"dibuat_oleh" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"aksi" varchar(100) NOT NULL,
	"objek" varchar(100) NOT NULL,
	"objek_id" varchar(100) NOT NULL,
	"nilai_sebelum" jsonb,
	"nilai_sesudah" jsonb,
	"alasan" text,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dokter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(255) NOT NULL,
	"spesialisasi" varchar(255) NOT NULL,
	"nomor_izin" varchar(100),
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "janji" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pasien_id" uuid NOT NULL,
	"dokter_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"status" "status_janji" DEFAULT 'aktif' NOT NULL,
	"keluhan" text,
	"catatan" text,
	"alasan_batal" text,
	"dibatalkan_oleh" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifikasi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"judul" varchar(255) NOT NULL,
	"pesan" text NOT NULL,
	"tipe" "tipe_notifikasi" DEFAULT 'sistem' NOT NULL,
	"dibaca" boolean DEFAULT false NOT NULL,
	"data_terkait" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dokter_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"jam_mulai" varchar(10) NOT NULL,
	"jam_selesai" varchar(10) NOT NULL,
	"kuota" integer DEFAULT 1 NOT NULL,
	"tersedia" boolean DEFAULT true NOT NULL,
	"dikunci_sampai" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usulan_perubahan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"janji_id" uuid NOT NULL,
	"slot_baru_id" uuid NOT NULL,
	"alasan" text NOT NULL,
	"status" "status_usulan" DEFAULT 'menunggu_tanggapan' NOT NULL,
	"batas_waktu_jawab" timestamp with time zone NOT NULL,
	"ttl_kunci_slot" timestamp with time zone NOT NULL,
	"dibuat_oleh" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aturan_kontrol" ADD CONSTRAINT "aturan_kontrol_pasien_id_users_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aturan_kontrol" ADD CONSTRAINT "aturan_kontrol_dokter_id_dokter_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."dokter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aturan_kontrol" ADD CONSTRAINT "aturan_kontrol_dibuat_oleh_users_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "janji" ADD CONSTRAINT "janji_pasien_id_users_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "janji" ADD CONSTRAINT "janji_dokter_id_dokter_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."dokter"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "janji" ADD CONSTRAINT "janji_slot_id_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "janji" ADD CONSTRAINT "janji_dibatalkan_oleh_users_id_fk" FOREIGN KEY ("dibatalkan_oleh") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_dokter_id_dokter_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."dokter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usulan_perubahan" ADD CONSTRAINT "usulan_perubahan_janji_id_janji_id_fk" FOREIGN KEY ("janji_id") REFERENCES "public"."janji"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usulan_perubahan" ADD CONSTRAINT "usulan_perubahan_slot_baru_id_slot_id_fk" FOREIGN KEY ("slot_baru_id") REFERENCES "public"."slot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usulan_perubahan" ADD CONSTRAINT "usulan_perubahan_dibuat_oleh_users_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aturan_kontrol_pasien_idx" ON "aturan_kontrol" USING btree ("pasien_id");--> statement-breakpoint
CREATE INDEX "aturan_kontrol_aktif_idx" ON "aturan_kontrol" USING btree ("aktif");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_objek_idx" ON "audit_log" USING btree ("objek","objek_id");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dokter_spesialisasi_idx" ON "dokter" USING btree ("spesialisasi");--> statement-breakpoint
CREATE INDEX "dokter_aktif_idx" ON "dokter" USING btree ("aktif");--> statement-breakpoint
CREATE INDEX "janji_pasien_idx" ON "janji" USING btree ("pasien_id");--> statement-breakpoint
CREATE INDEX "janji_dokter_idx" ON "janji" USING btree ("dokter_id");--> statement-breakpoint
CREATE INDEX "janji_slot_idx" ON "janji" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "janji_status_idx" ON "janji" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifikasi_user_idx" ON "notifikasi" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifikasi_dibaca_idx" ON "notifikasi" USING btree ("dibaca");--> statement-breakpoint
CREATE INDEX "slot_dokter_tanggal_idx" ON "slot" USING btree ("dokter_id","tanggal");--> statement-breakpoint
CREATE INDEX "slot_tersedia_idx" ON "slot" USING btree ("tersedia");--> statement-breakpoint
CREATE INDEX "usulan_janji_idx" ON "usulan_perubahan" USING btree ("janji_id");--> statement-breakpoint
CREATE INDEX "usulan_slot_baru_idx" ON "usulan_perubahan" USING btree ("slot_baru_id");--> statement-breakpoint
CREATE INDEX "usulan_status_idx" ON "usulan_perubahan" USING btree ("status");