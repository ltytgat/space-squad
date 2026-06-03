import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_consumables_categorie" AS ENUM('soins', 'munitions', 'grenades', 'tactique', 'outils');
  CREATE TABLE "consumables" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"categorie" "enum_consumables_categorie" NOT NULL,
  	"effet" varchar,
  	"epreuve" varchar,
  	"prix" numeric,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "consumables_id" integer;
  ALTER TABLE "consumables" ADD CONSTRAINT "consumables_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "consumables_image_idx" ON "consumables" USING btree ("image_id");
  CREATE INDEX "consumables_updated_at_idx" ON "consumables" USING btree ("updated_at");
  CREATE INDEX "consumables_created_at_idx" ON "consumables" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consumables_fk" FOREIGN KEY ("consumables_id") REFERENCES "public"."consumables"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_consumables_id_idx" ON "payload_locked_documents_rels" USING btree ("consumables_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "consumables" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "consumables" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_consumables_fk";
  
  DROP INDEX "payload_locked_documents_rels_consumables_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "consumables_id";
  DROP TYPE "public"."enum_consumables_categorie";`)
}
