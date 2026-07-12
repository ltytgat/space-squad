import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ship_sale_models_armes_emplacement" AS ENUM('pilote', 'tourelle-1', 'tourelle-2', 'tourelle-3', 'tourelle-4');
  CREATE TABLE "ship_sale_models_armes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"arme_id" integer NOT NULL,
  	"emplacement" "enum_ship_sale_models_armes_emplacement"
  );
  
  CREATE TABLE "ship_sale_models" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"chassis_id" integer NOT NULL,
  	"prix" varchar,
  	"generateur_id" integer NOT NULL,
  	"propulseurs_id" integer NOT NULL,
  	"boucliers_id" integer NOT NULL,
  	"survie_id" integer NOT NULL,
  	"description" varchar,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ship_sale_models_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"ship_modules_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ship_sale_models_id" integer;
  ALTER TABLE "ship_sale_models_armes" ADD CONSTRAINT "ship_sale_models_armes_arme_id_ship_weapons_id_fk" FOREIGN KEY ("arme_id") REFERENCES "public"."ship_weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models_armes" ADD CONSTRAINT "ship_sale_models_armes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ship_sale_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ship_sale_models" ADD CONSTRAINT "ship_sale_models_chassis_id_ship_models_id_fk" FOREIGN KEY ("chassis_id") REFERENCES "public"."ship_models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models" ADD CONSTRAINT "ship_sale_models_generateur_id_ship_modules_id_fk" FOREIGN KEY ("generateur_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models" ADD CONSTRAINT "ship_sale_models_propulseurs_id_ship_modules_id_fk" FOREIGN KEY ("propulseurs_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models" ADD CONSTRAINT "ship_sale_models_boucliers_id_ship_modules_id_fk" FOREIGN KEY ("boucliers_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models" ADD CONSTRAINT "ship_sale_models_survie_id_ship_modules_id_fk" FOREIGN KEY ("survie_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models" ADD CONSTRAINT "ship_sale_models_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models_rels" ADD CONSTRAINT "ship_sale_models_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ship_sale_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ship_sale_models_rels" ADD CONSTRAINT "ship_sale_models_rels_ship_modules_fk" FOREIGN KEY ("ship_modules_id") REFERENCES "public"."ship_modules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ship_sale_models_armes_order_idx" ON "ship_sale_models_armes" USING btree ("_order");
  CREATE INDEX "ship_sale_models_armes_parent_id_idx" ON "ship_sale_models_armes" USING btree ("_parent_id");
  CREATE INDEX "ship_sale_models_armes_arme_idx" ON "ship_sale_models_armes" USING btree ("arme_id");
  CREATE UNIQUE INDEX "ship_sale_models_nom_idx" ON "ship_sale_models" USING btree ("nom");
  CREATE INDEX "ship_sale_models_chassis_idx" ON "ship_sale_models" USING btree ("chassis_id");
  CREATE INDEX "ship_sale_models_generateur_idx" ON "ship_sale_models" USING btree ("generateur_id");
  CREATE INDEX "ship_sale_models_propulseurs_idx" ON "ship_sale_models" USING btree ("propulseurs_id");
  CREATE INDEX "ship_sale_models_boucliers_idx" ON "ship_sale_models" USING btree ("boucliers_id");
  CREATE INDEX "ship_sale_models_survie_idx" ON "ship_sale_models" USING btree ("survie_id");
  CREATE INDEX "ship_sale_models_image_idx" ON "ship_sale_models" USING btree ("image_id");
  CREATE INDEX "ship_sale_models_updated_at_idx" ON "ship_sale_models" USING btree ("updated_at");
  CREATE INDEX "ship_sale_models_created_at_idx" ON "ship_sale_models" USING btree ("created_at");
  CREATE INDEX "ship_sale_models_rels_order_idx" ON "ship_sale_models_rels" USING btree ("order");
  CREATE INDEX "ship_sale_models_rels_parent_idx" ON "ship_sale_models_rels" USING btree ("parent_id");
  CREATE INDEX "ship_sale_models_rels_path_idx" ON "ship_sale_models_rels" USING btree ("path");
  CREATE INDEX "ship_sale_models_rels_ship_modules_id_idx" ON "ship_sale_models_rels" USING btree ("ship_modules_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ship_sale_models_fk" FOREIGN KEY ("ship_sale_models_id") REFERENCES "public"."ship_sale_models"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_ship_sale_models_id_idx" ON "payload_locked_documents_rels" USING btree ("ship_sale_models_id");
  ALTER TABLE "ship_models" DROP COLUMN "generateur";
  ALTER TABLE "ship_models" DROP COLUMN "prix";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ship_sale_models_armes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ship_sale_models" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ship_sale_models_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ship_sale_models_armes" CASCADE;
  DROP TABLE "ship_sale_models" CASCADE;
  DROP TABLE "ship_sale_models_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ship_sale_models_fk";
  
  DROP INDEX "payload_locked_documents_rels_ship_sale_models_id_idx";
  ALTER TABLE "ship_models" ADD COLUMN "generateur" varchar;
  ALTER TABLE "ship_models" ADD COLUMN "prix" varchar;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ship_sale_models_id";
  DROP TYPE "public"."enum_ship_sale_models_armes_emplacement";`)
}
