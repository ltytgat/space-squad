import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_atelier_modifications_compatibilites_categorie_equipement" AS ENUM('arme', 'armure', 'vaisseau');
  CREATE TYPE "public"."enum_atelier_modifications_compatibilites_sous_categorie" AS ENUM('fusil-assaut', 'shotgun', 'sniper', 'pistolet', 'tete', 'torse', 'bras', 'jambes');
  CREATE TYPE "public"."enum_atelier_modifications_compatibilites_type_arme" AS ENUM('thermique', 'cinetique');
  CREATE TYPE "public"."enum_atelier_modifications_compatibilites_classe_vaisseau" AS ENUM('alpha', 'beta', 'gamma', 'delta');
  CREATE TYPE "public"."enum_atelier_modifications_effets_cible" AS ENUM('nom', 'fabricant', 'categorie', 'type', 'poids', 'prix', 'forceMinimum', 'valeurDegats', 'zoneEffet', 'projectilesParTir', 'tempsRechargement', 'porteeFixe', 'courtePortee', 'modCourtePortee', 'moyennePortee', 'modMoyennePortee', 'paliersSniper', 'trancheMalusLonguePortee', 'malusParTranche', 'tailleChargeur', 'valeurChauffe', 'tempsRefroidissement', 'valeurArmurePhysique', 'valeurBouclier', 'valeurRupture', 'modificateur', 'stockage', 'set', 'image', 'classe', 'tourelles', 'pointsEmportPilote', 'pointsEmportTourelles', 'blindage', 'modulesSupplementaires', 'consommables', 'esquiveBase');
  CREATE TYPE "public"."enum_atelier_modifications_effets_operation" AS ENUM('percent', 'add', 'replace', 'dice-bonus', 'slot-add');
  CREATE TYPE "public"."enum_custom_equipment_categorie_equipement" AS ENUM('arme', 'armure');
  CREATE TABLE "atelier_modifications_compatibilites" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"categorie_equipement" "enum_atelier_modifications_compatibilites_categorie_equipement" NOT NULL,
  	"sous_categorie" "enum_atelier_modifications_compatibilites_sous_categorie",
  	"type_arme" "enum_atelier_modifications_compatibilites_type_arme",
  	"classe_vaisseau" "enum_atelier_modifications_compatibilites_classe_vaisseau"
  );
  
  CREATE TABLE "atelier_modifications_effets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cible" "enum_atelier_modifications_effets_cible" NOT NULL,
  	"operation" "enum_atelier_modifications_effets_operation" NOT NULL,
  	"valeur" varchar NOT NULL
  );
  
  CREATE TABLE "atelier_modifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"description" varchar,
  	"prix" numeric NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "custom_equipment_modifications_atelier" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"modification_source_id" numeric,
  	"nom" varchar NOT NULL,
  	"prix" numeric NOT NULL,
  	"effets" jsonb NOT NULL
  );
  
  CREATE TABLE "custom_equipment" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"categorie_equipement" "enum_custom_equipment_categorie_equipement" NOT NULL,
  	"categorie" varchar NOT NULL,
  	"type_arme" varchar,
  	"arme_source_id" integer,
  	"armure_source_id" integer,
  	"set_id" integer,
  	"proprietaire_actuel_id" integer NOT NULL,
  	"proprietaire_origine_id" integer NOT NULL,
  	"prix_achat" numeric NOT NULL,
  	"munitions_actuelles" numeric,
  	"chargeur_relie_id" integer,
  	"proprietes_figees" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "custom_equipment_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"mods_id" integer
  );

  ALTER TABLE "ships" ADD COLUMN "proprietaire_origine_atelier_id" integer;
  ALTER TABLE "ships" ADD COLUMN "prix_achat_atelier" numeric;
  ALTER TABLE "ships" ADD COLUMN "atelier_personnalise" boolean DEFAULT false;
  ALTER TABLE "ship_models" ADD COLUMN "atelier_prive" boolean DEFAULT false;
  ALTER TABLE "ship_models" ADD COLUMN "atelier_proprietaire_id" integer;
  ALTER TABLE "ship_sale_models" ADD COLUMN "atelier_prive" boolean DEFAULT false;
  ALTER TABLE "ship_sale_models" ADD COLUMN "atelier_proprietaire_id" integer;
  ALTER TABLE "ship_sale_models" ADD COLUMN "atelier_proprietaire_origine_id" integer;
  ALTER TABLE "ship_sale_models" ADD COLUMN "atelier_modele_source_id" integer;
  ALTER TABLE "ship_sale_models" ADD COLUMN "atelier_prix_achat" numeric;
  ALTER TABLE "ship_sale_models" ADD COLUMN "atelier_modifications" jsonb;
  ALTER TABLE "characters" ADD COLUMN "armure_tete_custom_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_torse_custom_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_bras_custom_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_jambes_custom_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_backpack_custom_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_principale_custom_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_secondaire_custom_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_lourde_custom_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_de_melee_custom_item_id" integer;
  ALTER TABLE "characters_rels" ADD COLUMN "custom_equipment_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "atelier_modifications_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "custom_equipment_id" integer;
  ALTER TABLE "atelier_modifications_compatibilites" ADD CONSTRAINT "atelier_modifications_compatibilites_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."atelier_modifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "atelier_modifications_effets" ADD CONSTRAINT "atelier_modifications_effets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."atelier_modifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "custom_equipment_modifications_atelier" ADD CONSTRAINT "custom_equipment_modifications_atelier_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."custom_equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "custom_equipment" ADD CONSTRAINT "custom_equipment_arme_source_id_weapons_id_fk" FOREIGN KEY ("arme_source_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "custom_equipment" ADD CONSTRAINT "custom_equipment_armure_source_id_armors_id_fk" FOREIGN KEY ("armure_source_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "custom_equipment" ADD CONSTRAINT "custom_equipment_set_id_armor_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."armor_sets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "custom_equipment" ADD CONSTRAINT "custom_equipment_proprietaire_actuel_id_characters_id_fk" FOREIGN KEY ("proprietaire_actuel_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "custom_equipment" ADD CONSTRAINT "custom_equipment_proprietaire_origine_id_characters_id_fk" FOREIGN KEY ("proprietaire_origine_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "custom_equipment" ADD CONSTRAINT "custom_equipment_chargeur_relie_id_consumables_id_fk" FOREIGN KEY ("chargeur_relie_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "custom_equipment_rels" ADD CONSTRAINT "custom_equipment_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."custom_equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "custom_equipment_rels" ADD CONSTRAINT "custom_equipment_rels_mods_fk" FOREIGN KEY ("mods_id") REFERENCES "public"."mods"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "atelier_modifications_compatibilites_order_idx" ON "atelier_modifications_compatibilites" USING btree ("_order");
  CREATE INDEX "atelier_modifications_compatibilites_parent_id_idx" ON "atelier_modifications_compatibilites" USING btree ("_parent_id");
  CREATE INDEX "atelier_modifications_effets_order_idx" ON "atelier_modifications_effets" USING btree ("_order");
  CREATE INDEX "atelier_modifications_effets_parent_id_idx" ON "atelier_modifications_effets" USING btree ("_parent_id");
  CREATE INDEX "atelier_modifications_updated_at_idx" ON "atelier_modifications" USING btree ("updated_at");
  CREATE INDEX "atelier_modifications_created_at_idx" ON "atelier_modifications" USING btree ("created_at");
  CREATE INDEX "custom_equipment_modifications_atelier_order_idx" ON "custom_equipment_modifications_atelier" USING btree ("_order");
  CREATE INDEX "custom_equipment_modifications_atelier_parent_id_idx" ON "custom_equipment_modifications_atelier" USING btree ("_parent_id");
  CREATE INDEX "custom_equipment_arme_source_idx" ON "custom_equipment" USING btree ("arme_source_id");
  CREATE INDEX "custom_equipment_armure_source_idx" ON "custom_equipment" USING btree ("armure_source_id");
  CREATE INDEX "custom_equipment_set_idx" ON "custom_equipment" USING btree ("set_id");
  CREATE INDEX "custom_equipment_proprietaire_actuel_idx" ON "custom_equipment" USING btree ("proprietaire_actuel_id");
  CREATE INDEX "custom_equipment_proprietaire_origine_idx" ON "custom_equipment" USING btree ("proprietaire_origine_id");
  CREATE INDEX "custom_equipment_chargeur_relie_idx" ON "custom_equipment" USING btree ("chargeur_relie_id");
  CREATE INDEX "custom_equipment_updated_at_idx" ON "custom_equipment" USING btree ("updated_at");
  CREATE INDEX "custom_equipment_created_at_idx" ON "custom_equipment" USING btree ("created_at");
  CREATE INDEX "custom_equipment_rels_order_idx" ON "custom_equipment_rels" USING btree ("order");
  CREATE INDEX "custom_equipment_rels_parent_idx" ON "custom_equipment_rels" USING btree ("parent_id");
  CREATE INDEX "custom_equipment_rels_path_idx" ON "custom_equipment_rels" USING btree ("path");
  CREATE INDEX "custom_equipment_rels_mods_id_idx" ON "custom_equipment_rels" USING btree ("mods_id");
  ALTER TABLE "ships" ADD CONSTRAINT "ships_proprietaire_origine_atelier_id_characters_id_fk" FOREIGN KEY ("proprietaire_origine_atelier_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_models" ADD CONSTRAINT "ship_models_atelier_proprietaire_id_characters_id_fk" FOREIGN KEY ("atelier_proprietaire_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models" ADD CONSTRAINT "ship_sale_models_atelier_proprietaire_id_characters_id_fk" FOREIGN KEY ("atelier_proprietaire_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models" ADD CONSTRAINT "ship_sale_models_atelier_proprietaire_origine_id_characters_id_fk" FOREIGN KEY ("atelier_proprietaire_origine_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ship_sale_models" ADD CONSTRAINT "ship_sale_models_atelier_modele_source_id_ship_sale_models_id_fk" FOREIGN KEY ("atelier_modele_source_id") REFERENCES "public"."ship_sale_models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_tete_custom_item_id_custom_equipment_id_fk" FOREIGN KEY ("armure_tete_custom_item_id") REFERENCES "public"."custom_equipment"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_torse_custom_item_id_custom_equipment_id_fk" FOREIGN KEY ("armure_torse_custom_item_id") REFERENCES "public"."custom_equipment"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_bras_custom_item_id_custom_equipment_id_fk" FOREIGN KEY ("armure_bras_custom_item_id") REFERENCES "public"."custom_equipment"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_jambes_custom_item_id_custom_equipment_id_fk" FOREIGN KEY ("armure_jambes_custom_item_id") REFERENCES "public"."custom_equipment"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_backpack_custom_item_id_custom_equipment_id_fk" FOREIGN KEY ("armure_backpack_custom_item_id") REFERENCES "public"."custom_equipment"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_principale_custom_item_id_custom_equipment_id_fk" FOREIGN KEY ("arme_principale_custom_item_id") REFERENCES "public"."custom_equipment"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_secondaire_custom_item_id_custom_equipment_id_fk" FOREIGN KEY ("arme_secondaire_custom_item_id") REFERENCES "public"."custom_equipment"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_lourde_custom_item_id_custom_equipment_id_fk" FOREIGN KEY ("arme_lourde_custom_item_id") REFERENCES "public"."custom_equipment"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_de_melee_custom_item_id_custom_equipment_id_fk" FOREIGN KEY ("arme_de_melee_custom_item_id") REFERENCES "public"."custom_equipment"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_custom_equipment_fk" FOREIGN KEY ("custom_equipment_id") REFERENCES "public"."custom_equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_atelier_modifications_fk" FOREIGN KEY ("atelier_modifications_id") REFERENCES "public"."atelier_modifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_custom_equipment_fk" FOREIGN KEY ("custom_equipment_id") REFERENCES "public"."custom_equipment"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ships_proprietaire_origine_atelier_idx" ON "ships" USING btree ("proprietaire_origine_atelier_id");
  CREATE INDEX "ship_models_atelier_proprietaire_idx" ON "ship_models" USING btree ("atelier_proprietaire_id");
  CREATE INDEX "ship_sale_models_atelier_proprietaire_idx" ON "ship_sale_models" USING btree ("atelier_proprietaire_id");
  CREATE INDEX "ship_sale_models_atelier_proprietaire_origine_idx" ON "ship_sale_models" USING btree ("atelier_proprietaire_origine_id");
  CREATE INDEX "ship_sale_models_atelier_modele_source_idx" ON "ship_sale_models" USING btree ("atelier_modele_source_id");
  CREATE INDEX "characters_armure_tete_armure_tete_custom_item_idx" ON "characters" USING btree ("armure_tete_custom_item_id");
  CREATE INDEX "characters_armure_torse_armure_torse_custom_item_idx" ON "characters" USING btree ("armure_torse_custom_item_id");
  CREATE INDEX "characters_armure_bras_armure_bras_custom_item_idx" ON "characters" USING btree ("armure_bras_custom_item_id");
  CREATE INDEX "characters_armure_jambes_armure_jambes_custom_item_idx" ON "characters" USING btree ("armure_jambes_custom_item_id");
  CREATE INDEX "characters_armure_backpack_armure_backpack_custom_item_idx" ON "characters" USING btree ("armure_backpack_custom_item_id");
  CREATE INDEX "characters_arme_principale_arme_principale_custom_item_idx" ON "characters" USING btree ("arme_principale_custom_item_id");
  CREATE INDEX "characters_arme_secondaire_arme_secondaire_custom_item_idx" ON "characters" USING btree ("arme_secondaire_custom_item_id");
  CREATE INDEX "characters_arme_lourde_arme_lourde_custom_item_idx" ON "characters" USING btree ("arme_lourde_custom_item_id");
  CREATE INDEX "characters_arme_de_melee_arme_de_melee_custom_item_idx" ON "characters" USING btree ("arme_de_melee_custom_item_id");
  CREATE INDEX "characters_rels_custom_equipment_id_idx" ON "characters_rels" USING btree ("custom_equipment_id");
  CREATE INDEX "payload_locked_documents_rels_atelier_modifications_id_idx" ON "payload_locked_documents_rels" USING btree ("atelier_modifications_id");
  CREATE INDEX "payload_locked_documents_rels_custom_equipment_id_idx" ON "payload_locked_documents_rels" USING btree ("custom_equipment_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  
  ALTER TABLE "atelier_modifications_compatibilites" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "atelier_modifications_effets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "atelier_modifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "custom_equipment_modifications_atelier" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "custom_equipment" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "custom_equipment_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "atelier_modifications_compatibilites" CASCADE;
  DROP TABLE "atelier_modifications_effets" CASCADE;
  DROP TABLE "atelier_modifications" CASCADE;
  DROP TABLE "custom_equipment_modifications_atelier" CASCADE;
  DROP TABLE "custom_equipment" CASCADE;
  DROP TABLE "custom_equipment_rels" CASCADE;

  ALTER TABLE "ship_sale_models" DROP CONSTRAINT "ship_sale_models_atelier_modele_source_id_ship_sale_models_id_fk";

  DROP INDEX "ships_proprietaire_origine_atelier_idx";
  DROP INDEX "ship_models_atelier_proprietaire_idx";
  DROP INDEX "ship_sale_models_atelier_proprietaire_idx";
  DROP INDEX "ship_sale_models_atelier_proprietaire_origine_idx";
  DROP INDEX "ship_sale_models_atelier_modele_source_idx";
  DROP INDEX "characters_armure_tete_armure_tete_custom_item_idx";
  DROP INDEX "characters_armure_torse_armure_torse_custom_item_idx";
  DROP INDEX "characters_armure_bras_armure_bras_custom_item_idx";
  DROP INDEX "characters_armure_jambes_armure_jambes_custom_item_idx";
  DROP INDEX "characters_armure_backpack_armure_backpack_custom_item_idx";
  DROP INDEX "characters_arme_principale_arme_principale_custom_item_idx";
  DROP INDEX "characters_arme_secondaire_arme_secondaire_custom_item_idx";
  DROP INDEX "characters_arme_lourde_arme_lourde_custom_item_idx";
  DROP INDEX "characters_arme_de_melee_arme_de_melee_custom_item_idx";
  DROP INDEX "characters_rels_custom_equipment_id_idx";
  DROP INDEX "payload_locked_documents_rels_atelier_modifications_id_idx";
  DROP INDEX "payload_locked_documents_rels_custom_equipment_id_idx";
  ALTER TABLE "ships" DROP COLUMN "proprietaire_origine_atelier_id";
  ALTER TABLE "ships" DROP COLUMN "prix_achat_atelier";
  ALTER TABLE "ships" DROP COLUMN "atelier_personnalise";
  ALTER TABLE "ship_models" DROP COLUMN "atelier_prive";
  ALTER TABLE "ship_models" DROP COLUMN "atelier_proprietaire_id";
  ALTER TABLE "ship_sale_models" DROP COLUMN "atelier_prive";
  ALTER TABLE "ship_sale_models" DROP COLUMN "atelier_proprietaire_id";
  ALTER TABLE "ship_sale_models" DROP COLUMN "atelier_proprietaire_origine_id";
  ALTER TABLE "ship_sale_models" DROP COLUMN "atelier_modele_source_id";
  ALTER TABLE "ship_sale_models" DROP COLUMN "atelier_prix_achat";
  ALTER TABLE "ship_sale_models" DROP COLUMN "atelier_modifications";
  ALTER TABLE "characters" DROP COLUMN "armure_tete_custom_item_id";
  ALTER TABLE "characters" DROP COLUMN "armure_torse_custom_item_id";
  ALTER TABLE "characters" DROP COLUMN "armure_bras_custom_item_id";
  ALTER TABLE "characters" DROP COLUMN "armure_jambes_custom_item_id";
  ALTER TABLE "characters" DROP COLUMN "armure_backpack_custom_item_id";
  ALTER TABLE "characters" DROP COLUMN "arme_principale_custom_item_id";
  ALTER TABLE "characters" DROP COLUMN "arme_secondaire_custom_item_id";
  ALTER TABLE "characters" DROP COLUMN "arme_lourde_custom_item_id";
  ALTER TABLE "characters" DROP COLUMN "arme_de_melee_custom_item_id";
  ALTER TABLE "characters_rels" DROP COLUMN "custom_equipment_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "atelier_modifications_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "custom_equipment_id";
  DROP TYPE "public"."enum_atelier_modifications_compatibilites_categorie_equipement";
  DROP TYPE "public"."enum_atelier_modifications_compatibilites_sous_categorie";
  DROP TYPE "public"."enum_atelier_modifications_compatibilites_type_arme";
  DROP TYPE "public"."enum_atelier_modifications_compatibilites_classe_vaisseau";
  DROP TYPE "public"."enum_atelier_modifications_effets_cible";
  DROP TYPE "public"."enum_atelier_modifications_effets_operation";
  DROP TYPE "public"."enum_custom_equipment_categorie_equipement";`)
}
