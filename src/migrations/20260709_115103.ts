import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ship_models_classe" AS ENUM('alpha', 'beta', 'gamma', 'delta');
  CREATE TYPE "public"."enum_ship_models_categorie" AS ENUM('polyvalent', 'combat', 'exploration', 'transport');
  CREATE TYPE "public"."enum_ship_weapons_taille" AS ENUM('1', '2', '3', '4');
  CREATE TYPE "public"."enum_ship_weapons_modele" AS ENUM('G', 'F', 'E', 'D', 'C', 'B', 'A', 'S');
  CREATE TYPE "public"."enum_ship_weapons_type" AS ENUM('thermique', 'cinetique', 'explosif', 'blindage');
  CREATE TYPE "public"."enum_ship_weapons_categorie" AS ENUM('cartouche', 'cinetique', 'lance-missile', 'mine', 'bouclier-joute');
  CREATE TYPE "public"."enum_ship_modules_famille" AS ENUM('_base_header', 'generateur', 'propulseurs', 'survie', 'boucliers', '_supp_header', 'blindage', 'reparateur', 'hangar', 'scanner', 'infirmerie', 'sas-abordage', 'ordinateur-tir', 'harmonisateur', 'baie-amarrage', 'pilotage-assiste', 'propulseurs-stardash');
  CREATE TYPE "public"."enum_ship_modules_type_module" AS ENUM('base', 'supplementaire');
  CREATE TYPE "public"."enum_ship_modules_taille" AS ENUM('1', '2', '3', '4');
  CREATE TYPE "public"."enum_ship_modules_modele" AS ENUM('E', 'D', 'C', 'B', 'A', 'S');
  CREATE TYPE "public"."enum_ship_consumables_categorie" AS ENUM('munitions', 'cartouches', 'roquettes', 'mines', 'reparation', 'energie', 'autre');
  CREATE TYPE "public"."enum_ship_consumables_taille" AS ENUM('toutes', '1', '2', '3', '4');
  CREATE TYPE "public"."enum_ship_consumables_modele" AS ENUM('G', 'F', 'E', 'D', 'C', 'B', 'A', 'S');
  CREATE TABLE "ships_canonniers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"personnage_id" integer,
  	"tourelle" numeric
  );
  
  CREATE TABLE "ships_armes_tourelles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tourelle" numeric
  );
  
  CREATE TABLE "ships_consommables_vaisseau" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"consommable_id" integer NOT NULL,
  	"quantite" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "ships_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"ship_modules_id" integer,
  	"ship_weapons_id" integer
  );
  
  CREATE TABLE "ship_models" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"classe" "enum_ship_models_classe" NOT NULL,
  	"categorie" "enum_ship_models_categorie" NOT NULL,
  	"tourelles" numeric DEFAULT 0 NOT NULL,
  	"points_emport_pilote" numeric DEFAULT 2 NOT NULL,
  	"points_emport_tourelles" varchar,
  	"blindage" numeric DEFAULT 25 NOT NULL,
  	"generateur" varchar,
  	"modules_supplementaires" varchar,
  	"consommables" numeric DEFAULT 1 NOT NULL,
  	"prix" varchar,
  	"esquive_base" numeric,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ship_weapons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"taille" "enum_ship_weapons_taille" NOT NULL,
  	"modele" "enum_ship_weapons_modele" NOT NULL,
  	"type" "enum_ship_weapons_type" NOT NULL,
  	"categorie" "enum_ship_weapons_categorie",
  	"degats" varchar,
  	"moyenne" numeric,
  	"chauffe" numeric,
  	"balles_par_salve" numeric,
  	"chargeur" numeric,
  	"distance" varchar,
  	"cooldown" numeric,
  	"bonus_blindage" numeric,
  	"points_emport" numeric DEFAULT 1,
  	"prix" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ship_modules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"famille" "enum_ship_modules_famille" NOT NULL,
  	"type_module" "enum_ship_modules_type_module" NOT NULL,
  	"taille" "enum_ship_modules_taille" NOT NULL,
  	"modele" "enum_ship_modules_modele" NOT NULL,
  	"consommation" numeric,
  	"prix" varchar,
  	"puissance" varchar,
  	"modificateurs" varchar,
  	"bouclier_max" numeric,
  	"cooldown_bouclier" numeric,
  	"recharge_bouclier" numeric,
  	"reparations" varchar,
  	"malus_poids" numeric,
  	"blindage_bonus" numeric,
  	"capacite" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ship_consumables" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"categorie" "enum_ship_consumables_categorie",
  	"taille" "enum_ship_consumables_taille",
  	"modele" "enum_ship_consumables_modele",
  	"calibre" varchar,
  	"bonus" varchar,
  	"prix" varchar,
  	"effet" varchar,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "characters" ALTER COLUMN "role_vaisseau" SET DATA TYPE text;
  DROP TYPE "public"."enum_characters_role_vaisseau";
  CREATE TYPE "public"."enum_characters_role_vaisseau" AS ENUM('pilote', 'copilote', 'canonnier', 'passager');
  ALTER TABLE "characters" ALTER COLUMN "role_vaisseau" SET DATA TYPE "public"."enum_characters_role_vaisseau" USING "role_vaisseau"::"public"."enum_characters_role_vaisseau";
  ALTER TABLE "ships" ADD COLUMN "modele_id" integer NOT NULL;
  ALTER TABLE "ships" ADD COLUMN "proprietaire_id" integer;
  ALTER TABLE "ships" ADD COLUMN "blindage_actuel" numeric;
  ALTER TABLE "ships" ADD COLUMN "bouclier_actuel" numeric;
  ALTER TABLE "ships" ADD COLUMN "esquive_actuelle" numeric;
  ALTER TABLE "ships" ADD COLUMN "consommation_actuelle" numeric;
  ALTER TABLE "ships" ADD COLUMN "pilote_id" integer;
  ALTER TABLE "ships" ADD COLUMN "copilote_id" integer;
  ALTER TABLE "ships" ADD COLUMN "module_generateur_id" integer;
  ALTER TABLE "ships" ADD COLUMN "module_propulseurs_id" integer;
  ALTER TABLE "ships" ADD COLUMN "module_survie_id" integer;
  ALTER TABLE "ships" ADD COLUMN "module_boucliers_id" integer;
  ALTER TABLE "ships" ADD COLUMN "notes" varchar;
  ALTER TABLE "ships" ADD COLUMN "image_id" integer;
  ALTER TABLE "armors" ADD COLUMN "poids" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ship_models_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ship_weapons_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ship_modules_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ship_consumables_id" integer;
  ALTER TABLE "ships_canonniers" ADD CONSTRAINT "ships_canonniers_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_canonniers" ADD CONSTRAINT "ships_canonniers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ships_armes_tourelles" ADD CONSTRAINT "ships_armes_tourelles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ships_consommables_vaisseau" ADD CONSTRAINT "ships_consommables_vaisseau_consommable_id_ship_consumables_id_fk" FOREIGN KEY ("consommable_id") REFERENCES "public"."ship_consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_consommables_vaisseau" ADD CONSTRAINT "ships_consommables_vaisseau_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ships_rels" ADD CONSTRAINT "ships_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ships_rels" ADD CONSTRAINT "ships_rels_ship_modules_fk" FOREIGN KEY ("ship_modules_id") REFERENCES "public"."ship_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ships_rels" ADD CONSTRAINT "ships_rels_ship_weapons_fk" FOREIGN KEY ("ship_weapons_id") REFERENCES "public"."ship_weapons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ship_models" ADD CONSTRAINT "ship_models_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_weapons" ADD CONSTRAINT "ship_weapons_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_modules" ADD CONSTRAINT "ship_modules_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_consumables" ADD CONSTRAINT "ship_consumables_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ships_canonniers_order_idx" ON "ships_canonniers" USING btree ("_order");
  CREATE INDEX "ships_canonniers_parent_id_idx" ON "ships_canonniers" USING btree ("_parent_id");
  CREATE INDEX "ships_canonniers_personnage_idx" ON "ships_canonniers" USING btree ("personnage_id");
  CREATE INDEX "ships_armes_tourelles_order_idx" ON "ships_armes_tourelles" USING btree ("_order");
  CREATE INDEX "ships_armes_tourelles_parent_id_idx" ON "ships_armes_tourelles" USING btree ("_parent_id");
  CREATE INDEX "ships_consommables_vaisseau_order_idx" ON "ships_consommables_vaisseau" USING btree ("_order");
  CREATE INDEX "ships_consommables_vaisseau_parent_id_idx" ON "ships_consommables_vaisseau" USING btree ("_parent_id");
  CREATE INDEX "ships_consommables_vaisseau_consommable_idx" ON "ships_consommables_vaisseau" USING btree ("consommable_id");
  CREATE INDEX "ships_rels_order_idx" ON "ships_rels" USING btree ("order");
  CREATE INDEX "ships_rels_parent_idx" ON "ships_rels" USING btree ("parent_id");
  CREATE INDEX "ships_rels_path_idx" ON "ships_rels" USING btree ("path");
  CREATE INDEX "ships_rels_ship_modules_id_idx" ON "ships_rels" USING btree ("ship_modules_id");
  CREATE INDEX "ships_rels_ship_weapons_id_idx" ON "ships_rels" USING btree ("ship_weapons_id");
  CREATE UNIQUE INDEX "ship_models_nom_idx" ON "ship_models" USING btree ("nom");
  CREATE INDEX "ship_models_image_idx" ON "ship_models" USING btree ("image_id");
  CREATE INDEX "ship_models_updated_at_idx" ON "ship_models" USING btree ("updated_at");
  CREATE INDEX "ship_models_created_at_idx" ON "ship_models" USING btree ("created_at");
  CREATE INDEX "ship_weapons_image_idx" ON "ship_weapons" USING btree ("image_id");
  CREATE INDEX "ship_weapons_updated_at_idx" ON "ship_weapons" USING btree ("updated_at");
  CREATE INDEX "ship_weapons_created_at_idx" ON "ship_weapons" USING btree ("created_at");
  CREATE INDEX "ship_modules_image_idx" ON "ship_modules" USING btree ("image_id");
  CREATE INDEX "ship_modules_updated_at_idx" ON "ship_modules" USING btree ("updated_at");
  CREATE INDEX "ship_modules_created_at_idx" ON "ship_modules" USING btree ("created_at");
  CREATE INDEX "ship_consumables_image_idx" ON "ship_consumables" USING btree ("image_id");
  CREATE INDEX "ship_consumables_updated_at_idx" ON "ship_consumables" USING btree ("updated_at");
  CREATE INDEX "ship_consumables_created_at_idx" ON "ship_consumables" USING btree ("created_at");
  ALTER TABLE "ships" ADD CONSTRAINT "ships_modele_id_ship_models_id_fk" FOREIGN KEY ("modele_id") REFERENCES "public"."ship_models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships" ADD CONSTRAINT "ships_proprietaire_id_characters_id_fk" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships" ADD CONSTRAINT "ships_pilote_id_characters_id_fk" FOREIGN KEY ("pilote_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships" ADD CONSTRAINT "ships_copilote_id_characters_id_fk" FOREIGN KEY ("copilote_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships" ADD CONSTRAINT "ships_module_generateur_id_ship_modules_id_fk" FOREIGN KEY ("module_generateur_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships" ADD CONSTRAINT "ships_module_propulseurs_id_ship_modules_id_fk" FOREIGN KEY ("module_propulseurs_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships" ADD CONSTRAINT "ships_module_survie_id_ship_modules_id_fk" FOREIGN KEY ("module_survie_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships" ADD CONSTRAINT "ships_module_boucliers_id_ship_modules_id_fk" FOREIGN KEY ("module_boucliers_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships" ADD CONSTRAINT "ships_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ship_models_fk" FOREIGN KEY ("ship_models_id") REFERENCES "public"."ship_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ship_weapons_fk" FOREIGN KEY ("ship_weapons_id") REFERENCES "public"."ship_weapons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ship_modules_fk" FOREIGN KEY ("ship_modules_id") REFERENCES "public"."ship_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ship_consumables_fk" FOREIGN KEY ("ship_consumables_id") REFERENCES "public"."ship_consumables"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ships_modele_idx" ON "ships" USING btree ("modele_id");
  CREATE INDEX "ships_proprietaire_idx" ON "ships" USING btree ("proprietaire_id");
  CREATE INDEX "ships_pilote_idx" ON "ships" USING btree ("pilote_id");
  CREATE INDEX "ships_copilote_idx" ON "ships" USING btree ("copilote_id");
  CREATE INDEX "ships_module_generateur_idx" ON "ships" USING btree ("module_generateur_id");
  CREATE INDEX "ships_module_propulseurs_idx" ON "ships" USING btree ("module_propulseurs_id");
  CREATE INDEX "ships_module_survie_idx" ON "ships" USING btree ("module_survie_id");
  CREATE INDEX "ships_module_boucliers_idx" ON "ships" USING btree ("module_boucliers_id");
  CREATE INDEX "ships_image_idx" ON "ships" USING btree ("image_id");
  CREATE INDEX "payload_locked_documents_rels_ship_models_id_idx" ON "payload_locked_documents_rels" USING btree ("ship_models_id");
  CREATE INDEX "payload_locked_documents_rels_ship_weapons_id_idx" ON "payload_locked_documents_rels" USING btree ("ship_weapons_id");
  CREATE INDEX "payload_locked_documents_rels_ship_modules_id_idx" ON "payload_locked_documents_rels" USING btree ("ship_modules_id");
  CREATE INDEX "payload_locked_documents_rels_ship_consumables_id_idx" ON "payload_locked_documents_rels" USING btree ("ship_consumables_id");
  ALTER TABLE "ships" DROP COLUMN "classe";
  ALTER TABLE "ships" DROP COLUMN "modele";
  DROP TYPE "public"."enum_ships_classe";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ships_classe" AS ENUM('alpha', 'beta', 'gamma', 'delta');
  ALTER TABLE "ships_canonniers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ships_armes_tourelles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ships_consommables_vaisseau" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ships_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ship_models" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ship_weapons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ship_modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ship_consumables" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ships_canonniers" CASCADE;
  DROP TABLE "ships_armes_tourelles" CASCADE;
  DROP TABLE "ships_consommables_vaisseau" CASCADE;
  DROP TABLE "ships_rels" CASCADE;
  DROP TABLE "ship_models" CASCADE;
  DROP TABLE "ship_weapons" CASCADE;
  DROP TABLE "ship_modules" CASCADE;
  DROP TABLE "ship_consumables" CASCADE;
  ALTER TABLE "ships" DROP CONSTRAINT "ships_modele_id_ship_models_id_fk";
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_proprietaire_id_characters_id_fk";
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_pilote_id_characters_id_fk";
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_copilote_id_characters_id_fk";
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_module_generateur_id_ship_modules_id_fk";
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_module_propulseurs_id_ship_modules_id_fk";
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_module_survie_id_ship_modules_id_fk";
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_module_boucliers_id_ship_modules_id_fk";
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ship_models_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ship_weapons_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ship_modules_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ship_consumables_fk";
  
  ALTER TABLE "characters" ALTER COLUMN "role_vaisseau" SET DATA TYPE text;
  DROP TYPE "public"."enum_characters_role_vaisseau";
  CREATE TYPE "public"."enum_characters_role_vaisseau" AS ENUM('proprietaire', 'passager');
  ALTER TABLE "characters" ALTER COLUMN "role_vaisseau" SET DATA TYPE "public"."enum_characters_role_vaisseau" USING "role_vaisseau"::"public"."enum_characters_role_vaisseau";
  DROP INDEX "ships_modele_idx";
  DROP INDEX "ships_proprietaire_idx";
  DROP INDEX "ships_pilote_idx";
  DROP INDEX "ships_copilote_idx";
  DROP INDEX "ships_module_generateur_idx";
  DROP INDEX "ships_module_propulseurs_idx";
  DROP INDEX "ships_module_survie_idx";
  DROP INDEX "ships_module_boucliers_idx";
  DROP INDEX "ships_image_idx";
  DROP INDEX "payload_locked_documents_rels_ship_models_id_idx";
  DROP INDEX "payload_locked_documents_rels_ship_weapons_id_idx";
  DROP INDEX "payload_locked_documents_rels_ship_modules_id_idx";
  DROP INDEX "payload_locked_documents_rels_ship_consumables_id_idx";
  ALTER TABLE "ships" ADD COLUMN "classe" "enum_ships_classe";
  ALTER TABLE "ships" ADD COLUMN "modele" varchar;
  ALTER TABLE "ships" DROP COLUMN "modele_id";
  ALTER TABLE "ships" DROP COLUMN "proprietaire_id";
  ALTER TABLE "ships" DROP COLUMN "blindage_actuel";
  ALTER TABLE "ships" DROP COLUMN "bouclier_actuel";
  ALTER TABLE "ships" DROP COLUMN "esquive_actuelle";
  ALTER TABLE "ships" DROP COLUMN "consommation_actuelle";
  ALTER TABLE "ships" DROP COLUMN "pilote_id";
  ALTER TABLE "ships" DROP COLUMN "copilote_id";
  ALTER TABLE "ships" DROP COLUMN "module_generateur_id";
  ALTER TABLE "ships" DROP COLUMN "module_propulseurs_id";
  ALTER TABLE "ships" DROP COLUMN "module_survie_id";
  ALTER TABLE "ships" DROP COLUMN "module_boucliers_id";
  ALTER TABLE "ships" DROP COLUMN "notes";
  ALTER TABLE "ships" DROP COLUMN "image_id";
  ALTER TABLE "armors" DROP COLUMN "poids";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ship_models_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ship_weapons_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ship_modules_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ship_consumables_id";
  DROP TYPE "public"."enum_ship_models_classe";
  DROP TYPE "public"."enum_ship_models_categorie";
  DROP TYPE "public"."enum_ship_weapons_taille";
  DROP TYPE "public"."enum_ship_weapons_modele";
  DROP TYPE "public"."enum_ship_weapons_type";
  DROP TYPE "public"."enum_ship_weapons_categorie";
  DROP TYPE "public"."enum_ship_modules_famille";
  DROP TYPE "public"."enum_ship_modules_type_module";
  DROP TYPE "public"."enum_ship_modules_taille";
  DROP TYPE "public"."enum_ship_modules_modele";
  DROP TYPE "public"."enum_ship_consumables_categorie";
  DROP TYPE "public"."enum_ship_consumables_taille";
  DROP TYPE "public"."enum_ship_consumables_modele";`)
}
