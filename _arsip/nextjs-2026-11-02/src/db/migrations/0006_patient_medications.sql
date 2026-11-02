CREATE TABLE "obat_pasien" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pasien_id" uuid NOT NULL,
	"katalog_obat_fornas_id" uuid,
	"nama_obat" varchar(255) NOT NULL,
	"nama_internasional" varchar(255),
	"dosis_catatan" varchar(100),
	"frekuensi_catatan" varchar(100),
	"mulai_pada" date,
	"selesai_pada" date,
	"catatan" text,
	"sumber" varchar(50) DEFAULT 'dilaporkan_pasien' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "obat_pasien" ADD CONSTRAINT "obat_pasien_pasien_id_users_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obat_pasien" ADD CONSTRAINT "obat_pasien_katalog_obat_fornas_id_katalog_obat_fornas_id_fk" FOREIGN KEY ("katalog_obat_fornas_id") REFERENCES "public"."katalog_obat_fornas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "obat_pasien_pasien_id_idx" ON "obat_pasien" USING btree ("pasien_id");--> statement-breakpoint
CREATE INDEX "obat_pasien_katalog_id_idx" ON "obat_pasien" USING btree ("katalog_obat_fornas_id");