import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_vehicle_variants_classe" AS ENUM('alpha', 'beta', 'gamma', 'delta');
  CREATE TYPE "public"."enum_vehicle_variants_position" AS ENUM('1', '2');
  CREATE TYPE "public"."enum_vehicle_sale_models_tourelle_classe_max" AS ENUM('alpha', 'beta');
  CREATE TABLE "vehicle_variants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"classe" "enum_vehicle_variants_classe" NOT NULL,
  	"position" "enum_vehicle_variants_position" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vehicle_sale_models" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"variante_id" integer NOT NULL,
  	"places" numeric NOT NULL,
  	"emports_armes_personnages" numeric NOT NULL,
  	"blindage_max" numeric NOT NULL,
  	"bouclier_max" numeric NOT NULL,
  	"recharge_bouclier" numeric NOT NULL,
  	"mouvement" numeric NOT NULL,
  	"prix" numeric NOT NULL,
  	"tout_terrain" boolean DEFAULT false,
  	"support_arme" boolean DEFAULT false,
  	"turbo_bonus" numeric,
  	"tourelle_classe_max" "enum_vehicle_sale_models_tourelle_classe_max",
  	"remorque_indice_poids" numeric,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vehicles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"modele_id" integer NOT NULL,
  	"proprietaire_id" integer,
  	"blindage_actuel" numeric NOT NULL,
  	"arme_tourelle_id" integer,
  	"chargeur_relie_id" integer,
  	"munitions_actuelles" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vehicle_variants_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vehicle_sale_models_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vehicles_id" integer;
  ALTER TABLE "vehicle_sale_models" ADD CONSTRAINT "vehicle_sale_models_variante_id_vehicle_variants_id_fk" FOREIGN KEY ("variante_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicle_sale_models" ADD CONSTRAINT "vehicle_sale_models_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_modele_id_vehicle_sale_models_id_fk" FOREIGN KEY ("modele_id") REFERENCES "public"."vehicle_sale_models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_proprietaire_id_characters_id_fk" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_arme_tourelle_id_ship_weapons_id_fk" FOREIGN KEY ("arme_tourelle_id") REFERENCES "public"."ship_weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_chargeur_relie_id_ship_consumables_id_fk" FOREIGN KEY ("chargeur_relie_id") REFERENCES "public"."ship_consumables"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "vehicle_variants_updated_at_idx" ON "vehicle_variants" USING btree ("updated_at");
  CREATE INDEX "vehicle_variants_created_at_idx" ON "vehicle_variants" USING btree ("created_at");
  CREATE UNIQUE INDEX "classe_position_idx" ON "vehicle_variants" USING btree ("classe","position");
  CREATE UNIQUE INDEX "vehicle_sale_models_nom_idx" ON "vehicle_sale_models" USING btree ("nom");
  CREATE INDEX "vehicle_sale_models_variante_idx" ON "vehicle_sale_models" USING btree ("variante_id");
  CREATE INDEX "vehicle_sale_models_image_idx" ON "vehicle_sale_models" USING btree ("image_id");
  CREATE INDEX "vehicle_sale_models_updated_at_idx" ON "vehicle_sale_models" USING btree ("updated_at");
  CREATE INDEX "vehicle_sale_models_created_at_idx" ON "vehicle_sale_models" USING btree ("created_at");
  CREATE INDEX "vehicles_modele_idx" ON "vehicles" USING btree ("modele_id");
  CREATE INDEX "vehicles_proprietaire_idx" ON "vehicles" USING btree ("proprietaire_id");
  CREATE INDEX "vehicles_arme_tourelle_idx" ON "vehicles" USING btree ("arme_tourelle_id");
  CREATE INDEX "vehicles_chargeur_relie_idx" ON "vehicles" USING btree ("chargeur_relie_id");
  CREATE INDEX "vehicles_updated_at_idx" ON "vehicles" USING btree ("updated_at");
  CREATE INDEX "vehicles_created_at_idx" ON "vehicles" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicle_variants_fk" FOREIGN KEY ("vehicle_variants_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicle_sale_models_fk" FOREIGN KEY ("vehicle_sale_models_id") REFERENCES "public"."vehicle_sale_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicles_fk" FOREIGN KEY ("vehicles_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_vehicle_variants_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicle_variants_id");
  CREATE INDEX "payload_locked_documents_rels_vehicle_sale_models_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicle_sale_models_id");
  CREATE INDEX "payload_locked_documents_rels_vehicles_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicles_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vehicle_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vehicle_sale_models" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vehicles" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "vehicle_variants" CASCADE;
  DROP TABLE "vehicle_sale_models" CASCADE;
  DROP TABLE "vehicles" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vehicle_variants_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vehicle_sale_models_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vehicles_fk";
  
  DROP INDEX "payload_locked_documents_rels_vehicle_variants_id_idx";
  DROP INDEX "payload_locked_documents_rels_vehicle_sale_models_id_idx";
  DROP INDEX "payload_locked_documents_rels_vehicles_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vehicle_variants_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vehicle_sale_models_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vehicles_id";
  DROP TYPE "public"."enum_vehicle_variants_classe";
  DROP TYPE "public"."enum_vehicle_variants_position";
  DROP TYPE "public"."enum_vehicle_sale_models_tourelle_classe_max";`)
}
