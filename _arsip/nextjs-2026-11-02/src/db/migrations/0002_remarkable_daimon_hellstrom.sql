CREATE TYPE "public"."jenis_kelamin" AS ENUM('laki_laki', 'perempuan');--> statement-breakpoint
CREATE TYPE "public"."status_antrian" AS ENUM('belum_check_in', 'menunggu', 'diperiksa', 'selesai', 'tidak_hadir');--> statement-breakpoint
CREATE TYPE "public"."status_jadwal_kontrol" AS ENUM('terjadwal', 'selesai', 'terlewat', 'dibatalkan');--> statement-breakpoint
CREATE TYPE "public"."status_minum_obat" AS ENUM('sudah', 'belum');--> statement-breakpoint
CREATE TABLE "catatan_kebiasaan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pasien_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"hidrasi_ml" integer,
	"jam_tidur" integer,
	"aktivitas_menit" integer,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catatan_minum_obat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pasien_id" uuid NOT NULL,
	"obat_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"status" "status_minum_obat" DEFAULT 'sudah' NOT NULL,
	"waktu_minum" timestamp with time zone,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal_kontrol" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pasien_id" uuid NOT NULL,
	"aturan_kontrol_id" uuid,
	"dokter_id" uuid,
	"tanggal_rencana" date NOT NULL,
	"status" "status_jadwal_kontrol" DEFAULT 'terjadwal' NOT NULL,
	"janji_id" uuid,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "konten_statis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(150) NOT NULL,
	"judul" varchar(255) NOT NULL,
	"ringkasan" text NOT NULL,
	"isi" text NOT NULL,
	"kategori" varchar(100) NOT NULL,
	"kondisi_terkait" varchar(100),
	"url_sumber" varchar(500) NOT NULL,
	"tanggal_pengambilan" date NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "konten_statis_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "log_aktivitas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"jenis_aksi" varchar(100) NOT NULL,
	"objek" varchar(100) NOT NULL,
	"objek_id" varchar(100),
	"keterangan" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resep_id" uuid NOT NULL,
	"nama_obat" varchar(255) NOT NULL,
	"dosis" varchar(100) NOT NULL,
	"aturan_pakai" varchar(100) NOT NULL,
	"frekuensi_per_hari" integer DEFAULT 1 NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date NOT NULL,
	"rujukan_fornas" varchar(255),
	"keterangan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profil" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nik" varchar(16),
	"nomor_telepon" varchar(20),
	"tanggal_lahir" date,
	"jenis_kelamin" "jenis_kelamin",
	"golongan_darah" varchar(5),
	"tinggi_badan" integer,
	"berat_badan" integer,
	"kondisi_kesehatan" text,
	"riwayat_alergi" text,
	"kontak_darurat_nama" varchar(255),
	"kontak_darurat_telepon" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profil_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "resep" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pasien_id" uuid NOT NULL,
	"janji_id" uuid,
	"dokter_id" uuid,
	"nomor_resep" varchar(100),
	"diagnosis" text,
	"catatan" text,
	"dibuat_oleh" uuid NOT NULL,
	"tanggal_resep" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tiket_antrian" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"janji_id" uuid NOT NULL,
	"pasien_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"nomor_antrian_final" integer,
	"status" "status_antrian" DEFAULT 'belum_check_in' NOT NULL,
	"waktu_check_in" timestamp with time zone,
	"waktu_panggil" timestamp with time zone,
	"waktu_selesai" timestamp with time zone,
	"alasan_koreksi" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tiket_antrian_janji_id_unique" UNIQUE("janji_id")
);
--> statement-breakpoint
ALTER TABLE "catatan_kebiasaan" ADD CONSTRAINT "catatan_kebiasaan_pasien_id_users_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catatan_minum_obat" ADD CONSTRAINT "catatan_minum_obat_pasien_id_users_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catatan_minum_obat" ADD CONSTRAINT "catatan_minum_obat_obat_id_obat_id_fk" FOREIGN KEY ("obat_id") REFERENCES "public"."obat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_kontrol" ADD CONSTRAINT "jadwal_kontrol_pasien_id_users_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_kontrol" ADD CONSTRAINT "jadwal_kontrol_aturan_kontrol_id_aturan_kontrol_id_fk" FOREIGN KEY ("aturan_kontrol_id") REFERENCES "public"."aturan_kontrol"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_kontrol" ADD CONSTRAINT "jadwal_kontrol_dokter_id_dokter_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."dokter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jadwal_kontrol" ADD CONSTRAINT "jadwal_kontrol_janji_id_janji_id_fk" FOREIGN KEY ("janji_id") REFERENCES "public"."janji"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_aktivitas" ADD CONSTRAINT "log_aktivitas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obat" ADD CONSTRAINT "obat_resep_id_resep_id_fk" FOREIGN KEY ("resep_id") REFERENCES "public"."resep"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profil" ADD CONSTRAINT "profil_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resep" ADD CONSTRAINT "resep_pasien_id_users_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resep" ADD CONSTRAINT "resep_janji_id_janji_id_fk" FOREIGN KEY ("janji_id") REFERENCES "public"."janji"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resep" ADD CONSTRAINT "resep_dokter_id_dokter_id_fk" FOREIGN KEY ("dokter_id") REFERENCES "public"."dokter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resep" ADD CONSTRAINT "resep_dibuat_oleh_users_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiket_antrian" ADD CONSTRAINT "tiket_antrian_janji_id_janji_id_fk" FOREIGN KEY ("janji_id") REFERENCES "public"."janji"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiket_antrian" ADD CONSTRAINT "tiket_antrian_pasien_id_users_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catatan_kebiasaan_pasien_idx" ON "catatan_kebiasaan" USING btree ("pasien_id");--> statement-breakpoint
CREATE INDEX "catatan_kebiasaan_tanggal_idx" ON "catatan_kebiasaan" USING btree ("tanggal");--> statement-breakpoint
CREATE UNIQUE INDEX "catatan_minum_obat_unique_idx" ON "catatan_minum_obat" USING btree ("pasien_id","obat_id","tanggal");--> statement-breakpoint
CREATE INDEX "catatan_minum_obat_pasien_tanggal_idx" ON "catatan_minum_obat" USING btree ("pasien_id","tanggal");--> statement-breakpoint
CREATE INDEX "jadwal_kontrol_pasien_idx" ON "jadwal_kontrol" USING btree ("pasien_id");--> statement-breakpoint
CREATE INDEX "jadwal_kontrol_tanggal_idx" ON "jadwal_kontrol" USING btree ("tanggal_rencana");--> statement-breakpoint
CREATE INDEX "jadwal_kontrol_status_idx" ON "jadwal_kontrol" USING btree ("status");--> statement-breakpoint
CREATE INDEX "konten_kategori_idx" ON "konten_statis" USING btree ("kategori");--> statement-breakpoint
CREATE INDEX "konten_kondisi_terkait_idx" ON "konten_statis" USING btree ("kondisi_terkait");--> statement-breakpoint
CREATE INDEX "log_aktivitas_user_idx" ON "log_aktivitas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "log_aktivitas_created_at_idx" ON "log_aktivitas" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "obat_resep_idx" ON "obat" USING btree ("resep_id");--> statement-breakpoint
CREATE INDEX "obat_aktif_idx" ON "obat" USING btree ("aktif");--> statement-breakpoint
CREATE INDEX "profil_user_id_idx" ON "profil" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "resep_pasien_idx" ON "resep" USING btree ("pasien_id");--> statement-breakpoint
CREATE INDEX "resep_tanggal_idx" ON "resep" USING btree ("tanggal_resep");--> statement-breakpoint
CREATE INDEX "tiket_antrian_pasien_idx" ON "tiket_antrian" USING btree ("pasien_id");--> statement-breakpoint
CREATE INDEX "tiket_antrian_tanggal_idx" ON "tiket_antrian" USING btree ("tanggal");--> statement-breakpoint
CREATE INDEX "tiket_antrian_status_idx" ON "tiket_antrian" USING btree ("status");