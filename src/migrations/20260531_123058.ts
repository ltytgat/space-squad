import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_armors_categorie" AS ENUM('tete', 'torse', 'bras', 'jambes', 'backpack');
  CREATE TABLE "armor_sets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"bonus" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "weapons" ALTER COLUMN "valeur_degats" SET DATA TYPE varchar;
  ALTER TABLE "armors" ALTER COLUMN "modificateur" SET DATA TYPE varchar;
  ALTER TABLE "armors" ADD COLUMN "categorie" "enum_armors_categorie" NOT NULL;
  ALTER TABLE "armors" ADD COLUMN "prix" numeric;
  ALTER TABLE "armors" ADD COLUMN "stockage" numeric;
  ALTER TABLE "armors" ADD COLUMN "set_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "armor_sets_id" integer;
  CREATE INDEX "armor_sets_updated_at_idx" ON "armor_sets" USING btree ("updated_at");
  CREATE INDEX "armor_sets_created_at_idx" ON "armor_sets" USING btree ("created_at");
  ALTER TABLE "armors" ADD CONSTRAINT "armors_set_id_armor_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."armor_sets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_armor_sets_fk" FOREIGN KEY ("armor_sets_id") REFERENCES "public"."armor_sets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "armors_set_idx" ON "armors" USING btree ("set_id");
  CREATE INDEX "payload_locked_documents_rels_armor_sets_id_idx" ON "payload_locked_documents_rels" USING btree ("armor_sets_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "armor_sets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "armor_sets" CASCADE;
  ALTER TABLE "armors" DROP CONSTRAINT "armors_set_id_armor_sets_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_armor_sets_fk";
  
  DROP INDEX "armors_set_idx";
  DROP INDEX "payload_locked_documents_rels_armor_sets_id_idx";
  ALTER TABLE "weapons" ALTER COLUMN "valeur_degats" SET DATA TYPE numeric;
  ALTER TABLE "armors" ALTER COLUMN "modificateur" SET DATA TYPE numeric;
  ALTER TABLE "armors" DROP COLUMN "categorie";
  ALTER TABLE "armors" DROP COLUMN "prix";
  ALTER TABLE "armors" DROP COLUMN "stockage";
  ALTER TABLE "armors" DROP COLUMN "set_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "armor_sets_id";
  DROP TYPE "public"."enum_armors_categorie";`)
}
