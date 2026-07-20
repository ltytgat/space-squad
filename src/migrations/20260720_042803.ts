import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "factions_rangs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"points_requis" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "factions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "characters" ADD COLUMN "affiliation_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "factions_id" integer;
  ALTER TABLE "factions_rangs" ADD CONSTRAINT "factions_rangs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."factions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "factions_rangs_order_idx" ON "factions_rangs" USING btree ("_order");
  CREATE INDEX "factions_rangs_parent_id_idx" ON "factions_rangs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "factions_nom_idx" ON "factions" USING btree ("nom");
  CREATE INDEX "factions_updated_at_idx" ON "factions" USING btree ("updated_at");
  CREATE INDEX "factions_created_at_idx" ON "factions" USING btree ("created_at");
  ALTER TABLE "characters" ADD CONSTRAINT "characters_affiliation_id_factions_id_fk" FOREIGN KEY ("affiliation_id") REFERENCES "public"."factions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_factions_fk" FOREIGN KEY ("factions_id") REFERENCES "public"."factions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "characters_affiliation_idx" ON "characters" USING btree ("affiliation_id");
  CREATE INDEX "payload_locked_documents_rels_factions_id_idx" ON "payload_locked_documents_rels" USING btree ("factions_id");
  ALTER TABLE "characters" DROP COLUMN "affiliation";
  DROP TYPE "public"."enum_characters_affiliation";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_characters_affiliation" AS ENUM('Alliance', 'Union', 'Guilde');
  ALTER TABLE "factions_rangs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "factions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "factions_rangs" CASCADE;
  DROP TABLE "factions" CASCADE;
  ALTER TABLE "characters" DROP CONSTRAINT "characters_affiliation_id_factions_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_factions_fk";
  
  DROP INDEX "characters_affiliation_idx";
  DROP INDEX "payload_locked_documents_rels_factions_id_idx";
  ALTER TABLE "characters" ADD COLUMN "affiliation" "enum_characters_affiliation";
  ALTER TABLE "characters" DROP COLUMN "affiliation_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "factions_id";`)
}
