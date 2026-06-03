import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_chips_categorie" AS ENUM('active', 'passive');
  CREATE TABLE "characters_reputation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"categorie" varchar NOT NULL,
  	"valeur" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "chips" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"categorie" "enum_chips_categorie" NOT NULL,
  	"effet" varchar NOT NULL,
  	"restriction" varchar,
  	"cooldown" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "characters" ADD COLUMN "points_de_competence" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "points_de_faction" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "rang_de_faction" varchar;
  ALTER TABLE "characters" ADD COLUMN "armure_backpack_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "puce_mk1_id" integer;
  ALTER TABLE "characters" ADD COLUMN "puce_mk2_id" integer;
  ALTER TABLE "characters" ADD COLUMN "puce_mk3_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "chips_id" integer;
  ALTER TABLE "characters_reputation" ADD CONSTRAINT "characters_reputation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "characters_reputation_order_idx" ON "characters_reputation" USING btree ("_order");
  CREATE INDEX "characters_reputation_parent_id_idx" ON "characters_reputation" USING btree ("_parent_id");
  CREATE INDEX "chips_updated_at_idx" ON "chips" USING btree ("updated_at");
  CREATE INDEX "chips_created_at_idx" ON "chips" USING btree ("created_at");
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_backpack_item_id_armors_id_fk" FOREIGN KEY ("armure_backpack_item_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_puce_mk1_id_chips_id_fk" FOREIGN KEY ("puce_mk1_id") REFERENCES "public"."chips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_puce_mk2_id_chips_id_fk" FOREIGN KEY ("puce_mk2_id") REFERENCES "public"."chips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_puce_mk3_id_chips_id_fk" FOREIGN KEY ("puce_mk3_id") REFERENCES "public"."chips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chips_fk" FOREIGN KEY ("chips_id") REFERENCES "public"."chips"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "characters_armure_backpack_armure_backpack_item_idx" ON "characters" USING btree ("armure_backpack_item_id");
  CREATE INDEX "characters_puce_mk1_idx" ON "characters" USING btree ("puce_mk1_id");
  CREATE INDEX "characters_puce_mk2_idx" ON "characters" USING btree ("puce_mk2_id");
  CREATE INDEX "characters_puce_mk3_idx" ON "characters" USING btree ("puce_mk3_id");
  CREATE INDEX "payload_locked_documents_rels_chips_id_idx" ON "payload_locked_documents_rels" USING btree ("chips_id");
  ALTER TABLE "characters" DROP COLUMN "backpack";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters_reputation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chips" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "characters_reputation" CASCADE;
  DROP TABLE "chips" CASCADE;
  ALTER TABLE "characters" DROP CONSTRAINT "characters_armure_backpack_item_id_armors_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_puce_mk1_id_chips_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_puce_mk2_id_chips_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_puce_mk3_id_chips_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_chips_fk";
  
  DROP INDEX "characters_armure_backpack_armure_backpack_item_idx";
  DROP INDEX "characters_puce_mk1_idx";
  DROP INDEX "characters_puce_mk2_idx";
  DROP INDEX "characters_puce_mk3_idx";
  DROP INDEX "payload_locked_documents_rels_chips_id_idx";
  ALTER TABLE "characters" ADD COLUMN "backpack" varchar;
  ALTER TABLE "characters" DROP COLUMN "points_de_competence";
  ALTER TABLE "characters" DROP COLUMN "points_de_faction";
  ALTER TABLE "characters" DROP COLUMN "rang_de_faction";
  ALTER TABLE "characters" DROP COLUMN "armure_backpack_item_id";
  ALTER TABLE "characters" DROP COLUMN "puce_mk1_id";
  ALTER TABLE "characters" DROP COLUMN "puce_mk2_id";
  ALTER TABLE "characters" DROP COLUMN "puce_mk3_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "chips_id";
  DROP TYPE "public"."enum_chips_categorie";`)
}
