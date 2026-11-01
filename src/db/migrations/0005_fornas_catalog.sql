CREATE TABLE "katalog_obat_fornas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama_indonesia" varchar(255) NOT NULL,
	"nama_internasional" varchar(255),
	"kode_resmi" varchar(100),
	"sumber" varchar(100) DEFAULT 'fornas' NOT NULL,
	"sumber_url" text NOT NULL,
	"versi_snapshot" varchar(100),
	"tanggal_snapshot" date NOT NULL,
	"cakupan_snapshot" varchar(50) NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "katalog_obat_fornas_snapshot_nama_idx" ON "katalog_obat_fornas" USING btree ("sumber","tanggal_snapshot","nama_indonesia");--> statement-breakpoint
CREATE INDEX "katalog_obat_fornas_nama_idx" ON "katalog_obat_fornas" USING btree ("nama_indonesia");--> statement-breakpoint
CREATE INDEX "katalog_obat_fornas_kode_resmi_idx" ON "katalog_obat_fornas" USING btree ("kode_resmi");