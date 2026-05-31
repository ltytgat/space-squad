import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mods_categorie_principale" AS ENUM('armes', 'armures');
  CREATE TYPE "public"."enum_mods_sous_categorie_arme" AS ENUM('toutes', 'fusils-pistolets', 'shotgun', 'snipers', 'melee');
  CREATE TYPE "public"."enum_mods_sous_categorie_armure" AS ENUM('toutes', 'tete', 'torse', 'bras', 'jambes');
  CREATE TABLE "weapons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"mods_id" integer
  );
  
  CREATE TABLE "armors_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"mods_id" integer
  );
  
  CREATE TABLE "mods" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"categorie_principale" "enum_mods_categorie_principale" NOT NULL,
  	"prix" numeric,
  	"sous_categorie_arme" "enum_mods_sous_categorie_arme",
  	"sous_categorie_armure" "enum_mods_sous_categorie_armure",
  	"effet" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "mods_id" integer;
  ALTER TABLE "weapons_rels" ADD CONSTRAINT "weapons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."weapons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "weapons_rels" ADD CONSTRAINT "weapons_rels_mods_fk" FOREIGN KEY ("mods_id") REFERENCES "public"."mods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "armors_rels" ADD CONSTRAINT "armors_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."armors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "armors_rels" ADD CONSTRAINT "armors_rels_mods_fk" FOREIGN KEY ("mods_id") REFERENCES "public"."mods"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "weapons_rels_order_idx" ON "weapons_rels" USING btree ("order");
  CREATE INDEX "weapons_rels_parent_idx" ON "weapons_rels" USING btree ("parent_id");
  CREATE INDEX "weapons_rels_path_idx" ON "weapons_rels" USING btree ("path");
  CREATE INDEX "weapons_rels_mods_id_idx" ON "weapons_rels" USING btree ("mods_id");
  CREATE INDEX "armors_rels_order_idx" ON "armors_rels" USING btree ("order");
  CREATE INDEX "armors_rels_parent_idx" ON "armors_rels" USING btree ("parent_id");
  CREATE INDEX "armors_rels_path_idx" ON "armors_rels" USING btree ("path");
  CREATE INDEX "armors_rels_mods_id_idx" ON "armors_rels" USING btree ("mods_id");
  CREATE INDEX "mods_updated_at_idx" ON "mods" USING btree ("updated_at");
  CREATE INDEX "mods_created_at_idx" ON "mods" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mods_fk" FOREIGN KEY ("mods_id") REFERENCES "public"."mods"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_mods_id_idx" ON "payload_locked_documents_rels" USING btree ("mods_id");
  ALTER TABLE "weapons" DROP COLUMN "mods";
  ALTER TABLE "armors" DROP COLUMN "mods";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "weapons_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "armors_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mods" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "weapons_rels" CASCADE;
  DROP TABLE "armors_rels" CASCADE;
  DROP TABLE "mods" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_mods_fk";
  
  DROP INDEX "payload_locked_documents_rels_mods_id_idx";
  ALTER TABLE "weapons" ADD COLUMN "mods" varchar;
  ALTER TABLE "armors" ADD COLUMN "mods" varchar;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "mods_id";
  DROP TYPE "public"."enum_mods_categorie_principale";
  DROP TYPE "public"."enum_mods_sous_categorie_arme";
  DROP TYPE "public"."enum_mods_sous_categorie_armure";`)
}
