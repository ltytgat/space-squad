import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_characters_inventaire_recompenses_faction_type_recompense" AS ENUM('acces-armes-ex', 'bon-reduction');
  CREATE TYPE "public"."enum_characters_inventaire_recompenses_faction_usage" AS ENUM('arme-sol', 'arme-espace', 'module-espace');
  CREATE TYPE "public"."enum_characters_creation_etape" AS ENUM('caracteristiques', 'espece', 'equipement', 'identite', 'termine');
  CREATE TYPE "public"."enum_formations_competence" AS ENUM('Chasseur', 'Bombardier', 'Poids Lourds', 'Transport de Troupes', 'Canonnier', 'Médecine de terrain', 'Concentration', 'Mécanicien', 'Stabilisation', 'Assaut', 'Sniper', 'Shotgun', 'Combat rapproché', 'Analyse', 'Réactivité', 'Furtivité', 'Diplomate', 'Culture');
  CREATE TYPE "public"."enum_mods_bonus_consommables_categorie" AS ENUM('soins', 'munitions', 'grenades', 'tactique', 'outils');
  CREATE TYPE "public"."enum_consumables_type_munition" AS ENUM('chargeur', 'cartouche', 'conteneur');
  CREATE TYPE "public"."enum_faction_reward_tiers_factions_application" AS ENUM('sol', 'espace', 'module');
  CREATE TYPE "public"."enum_faction_reward_tiers_type_recompense" AS ENUM('acces-armes-ex', 'bon-reduction');
  CREATE TYPE "public"."enum_session_rewards_scope_type" AS ENUM('group', 'selection');
  ALTER TYPE "public"."enum_mods_sous_categorie_armure" ADD VALUE 'backpack';
  CREATE TABLE "ships_armes_pilote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"arme_id" integer NOT NULL,
  	"munitions_actuelles" numeric DEFAULT 0,
  	"chargeur_relie_id" integer
  );
  
  CREATE TABLE "ships_armes_tourelles_armes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"arme_id" integer NOT NULL,
  	"munitions_actuelles" numeric DEFAULT 0,
  	"chargeur_relie_id" integer
  );
  
  CREATE TABLE "ships_inventaire_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"module_id" integer NOT NULL,
  	"quantite" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "ships_inventaire_armes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"arme_id" integer NOT NULL,
  	"quantite" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "ships_inventaire_consommables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"consommable_id" integer NOT NULL,
  	"quantite" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "characters_inventaire_recompenses_faction" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"effet" varchar NOT NULL,
  	"faction" varchar NOT NULL,
  	"grade" varchar NOT NULL,
  	"type_recompense" "enum_characters_inventaire_recompenses_faction_type_recompense",
  	"pourcentage_reduction" numeric,
  	"usage" "enum_characters_inventaire_recompenses_faction_usage"
  );
  
  CREATE TABLE "formations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"competence" "enum_formations_competence" NOT NULL,
  	"competence_label" varchar NOT NULL,
  	"organisation_formation_id" integer NOT NULL,
  	"cout_konis" numeric DEFAULT 0 NOT NULL,
  	"cout_points_de_rang" numeric DEFAULT 0 NOT NULL,
  	"cout_renommee" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "special_roles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"prix" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "mods_bonus_consommables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"categorie" "enum_mods_bonus_consommables_categorie" NOT NULL,
  	"quantite" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "faction_reward_tiers_factions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"faction_id" integer NOT NULL,
  	"description" varchar NOT NULL,
  	"application" "enum_faction_reward_tiers_factions_application"
  );
  
  CREATE TABLE "faction_reward_tiers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"type_recompense" "enum_faction_reward_tiers_type_recompense" DEFAULT 'bon-reduction' NOT NULL,
  	"pourcentage_reduction" numeric,
  	"cout_points_faction" numeric DEFAULT 0 NOT NULL,
  	"grade_requis" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "session_rewards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"batch_id" varchar NOT NULL,
  	"applied_by_id" integer NOT NULL,
  	"scope_type" "enum_session_rewards_scope_type" NOT NULL,
  	"group_id" integer,
  	"character_ids" jsonb NOT NULL,
  	"rewards" jsonb NOT NULL,
  	"per_character" jsonb NOT NULL,
  	"reverted" boolean DEFAULT false,
  	"reverted_at" timestamp(3) with time zone,
  	"reverted_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shop_transactions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"transaction_id" varchar NOT NULL,
  	"fingerprint" varchar NOT NULL,
  	"operation" varchar NOT NULL,
  	"actor_id" integer NOT NULL,
  	"character_id" integer NOT NULL,
  	"ship_id" integer,
  	"amount" numeric NOT NULL,
  	"details" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"priority" numeric,
  	"excerpt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"lore_articles_id" integer
  );
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_modele_id_ship_models_id_fk";
  
  ALTER TABLE "ships_rels" DROP CONSTRAINT "ships_rels_ship_weapons_fk";
  
  DROP INDEX "ships_rels_ship_weapons_id_idx";
  ALTER TABLE "ships_armes_tourelles" ADD COLUMN "module_id" integer;
  ALTER TABLE "ship_consumables" ADD COLUMN "quantite_equipable" numeric;
  ALTER TABLE "armors" ADD COLUMN "rang" numeric;
  ALTER TABLE "characters_inventaire_armes" ADD COLUMN "munitions_actuelles" numeric DEFAULT 0;
  ALTER TABLE "characters_inventaire_armes" ADD COLUMN "chargeur_relie_id" integer;
  ALTER TABLE "characters" ADD COLUMN "creation_etape" "enum_characters_creation_etape";
  ALTER TABLE "characters" ADD COLUMN "creation_jets" jsonb;
  ALTER TABLE "characters" ADD COLUMN "utilisations_kits_reparation" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "utilisations_kits_soins" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "coaching_force_label" varchar;
  ALTER TABLE "characters" ADD COLUMN "coaching_force_max" numeric;
  ALTER TABLE "characters" ADD COLUMN "coaching_force_value" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "coaching_habilite_label" varchar;
  ALTER TABLE "characters" ADD COLUMN "coaching_habilite_max" numeric;
  ALTER TABLE "characters" ADD COLUMN "coaching_habilite_value" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "coaching_connaissances_label" varchar;
  ALTER TABLE "characters" ADD COLUMN "coaching_connaissances_max" numeric;
  ALTER TABLE "characters" ADD COLUMN "coaching_connaissances_value" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "coaching_culture_label" varchar;
  ALTER TABLE "characters" ADD COLUMN "coaching_culture_max" numeric;
  ALTER TABLE "characters" ADD COLUMN "coaching_culture_value" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "coaching_anticipation_label" varchar;
  ALTER TABLE "characters" ADD COLUMN "coaching_anticipation_max" numeric;
  ALTER TABLE "characters" ADD COLUMN "coaching_anticipation_value" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "coaching_perception_label" varchar;
  ALTER TABLE "characters" ADD COLUMN "coaching_perception_max" numeric;
  ALTER TABLE "characters" ADD COLUMN "coaching_perception_value" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "arme_principale_munitions_actuelles" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "arme_principale_chargeur_relie_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_secondaire_munitions_actuelles" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "arme_secondaire_chargeur_relie_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_lourde_munitions_actuelles" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "arme_lourde_chargeur_relie_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_de_melee_munitions_actuelles" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "arme_de_melee_chargeur_relie_id" integer;
  ALTER TABLE "characters_rels" ADD COLUMN "special_roles_id" integer;
  ALTER TABLE "characters_rels" ADD COLUMN "consumables_id" integer;
  ALTER TABLE "consumables" ADD COLUMN "taille" numeric DEFAULT 2 NOT NULL;
  ALTER TABLE "consumables" ADD COLUMN "type_munition" "enum_consumables_type_munition";
  ALTER TABLE "consumables" ADD COLUMN "role_special_requis_id" integer;
  ALTER TABLE "chips" ADD COLUMN "image_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "formations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "special_roles_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faction_reward_tiers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "session_rewards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "shop_transactions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "search_id" integer;
  ALTER TABLE "ships_armes_pilote" ADD CONSTRAINT "ships_armes_pilote_arme_id_ship_weapons_id_fk" FOREIGN KEY ("arme_id") REFERENCES "public"."ship_weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_armes_pilote" ADD CONSTRAINT "ships_armes_pilote_chargeur_relie_id_ship_consumables_id_fk" FOREIGN KEY ("chargeur_relie_id") REFERENCES "public"."ship_consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_armes_pilote" ADD CONSTRAINT "ships_armes_pilote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ships_armes_tourelles_armes" ADD CONSTRAINT "ships_armes_tourelles_armes_arme_id_ship_weapons_id_fk" FOREIGN KEY ("arme_id") REFERENCES "public"."ship_weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_armes_tourelles_armes" ADD CONSTRAINT "ships_armes_tourelles_armes_chargeur_relie_id_ship_consumables_id_fk" FOREIGN KEY ("chargeur_relie_id") REFERENCES "public"."ship_consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_armes_tourelles_armes" ADD CONSTRAINT "ships_armes_tourelles_armes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ships_armes_tourelles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ships_inventaire_modules" ADD CONSTRAINT "ships_inventaire_modules_module_id_ship_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_inventaire_modules" ADD CONSTRAINT "ships_inventaire_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ships_inventaire_armes" ADD CONSTRAINT "ships_inventaire_armes_arme_id_ship_weapons_id_fk" FOREIGN KEY ("arme_id") REFERENCES "public"."ship_weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_inventaire_armes" ADD CONSTRAINT "ships_inventaire_armes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ships_inventaire_consommables" ADD CONSTRAINT "ships_inventaire_consommables_consommable_id_ship_consumables_id_fk" FOREIGN KEY ("consommable_id") REFERENCES "public"."ship_consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_inventaire_consommables" ADD CONSTRAINT "ships_inventaire_consommables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_inventaire_recompenses_faction" ADD CONSTRAINT "characters_inventaire_recompenses_faction_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "formations" ADD CONSTRAINT "formations_organisation_formation_id_factions_id_fk" FOREIGN KEY ("organisation_formation_id") REFERENCES "public"."factions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mods_bonus_consommables" ADD CONSTRAINT "mods_bonus_consommables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faction_reward_tiers_factions" ADD CONSTRAINT "faction_reward_tiers_factions_faction_id_factions_id_fk" FOREIGN KEY ("faction_id") REFERENCES "public"."factions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "faction_reward_tiers_factions" ADD CONSTRAINT "faction_reward_tiers_factions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faction_reward_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "session_rewards" ADD CONSTRAINT "session_rewards_applied_by_id_users_id_fk" FOREIGN KEY ("applied_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "session_rewards" ADD CONSTRAINT "session_rewards_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "session_rewards" ADD CONSTRAINT "session_rewards_reverted_by_id_users_id_fk" FOREIGN KEY ("reverted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_transactions" ADD CONSTRAINT "shop_transactions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_transactions" ADD CONSTRAINT "shop_transactions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_transactions" ADD CONSTRAINT "shop_transactions_ship_id_ships_id_fk" FOREIGN KEY ("ship_id") REFERENCES "public"."ships"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_lore_articles_fk" FOREIGN KEY ("lore_articles_id") REFERENCES "public"."lore_articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ships_armes_pilote_order_idx" ON "ships_armes_pilote" USING btree ("_order");
  CREATE INDEX "ships_armes_pilote_parent_id_idx" ON "ships_armes_pilote" USING btree ("_parent_id");
  CREATE INDEX "ships_armes_pilote_arme_idx" ON "ships_armes_pilote" USING btree ("arme_id");
  CREATE INDEX "ships_armes_pilote_chargeur_relie_idx" ON "ships_armes_pilote" USING btree ("chargeur_relie_id");
  CREATE INDEX "ships_armes_tourelles_armes_order_idx" ON "ships_armes_tourelles_armes" USING btree ("_order");
  CREATE INDEX "ships_armes_tourelles_armes_parent_id_idx" ON "ships_armes_tourelles_armes" USING btree ("_parent_id");
  CREATE INDEX "ships_armes_tourelles_armes_arme_idx" ON "ships_armes_tourelles_armes" USING btree ("arme_id");
  CREATE INDEX "ships_armes_tourelles_armes_chargeur_relie_idx" ON "ships_armes_tourelles_armes" USING btree ("chargeur_relie_id");
  CREATE INDEX "ships_inventaire_modules_order_idx" ON "ships_inventaire_modules" USING btree ("_order");
  CREATE INDEX "ships_inventaire_modules_parent_id_idx" ON "ships_inventaire_modules" USING btree ("_parent_id");
  CREATE INDEX "ships_inventaire_modules_module_idx" ON "ships_inventaire_modules" USING btree ("module_id");
  CREATE INDEX "ships_inventaire_armes_order_idx" ON "ships_inventaire_armes" USING btree ("_order");
  CREATE INDEX "ships_inventaire_armes_parent_id_idx" ON "ships_inventaire_armes" USING btree ("_parent_id");
  CREATE INDEX "ships_inventaire_armes_arme_idx" ON "ships_inventaire_armes" USING btree ("arme_id");
  CREATE INDEX "ships_inventaire_consommables_order_idx" ON "ships_inventaire_consommables" USING btree ("_order");
  CREATE INDEX "ships_inventaire_consommables_parent_id_idx" ON "ships_inventaire_consommables" USING btree ("_parent_id");
  CREATE INDEX "ships_inventaire_consommables_consommable_idx" ON "ships_inventaire_consommables" USING btree ("consommable_id");
  CREATE INDEX "characters_inventaire_recompenses_faction_order_idx" ON "characters_inventaire_recompenses_faction" USING btree ("_order");
  CREATE INDEX "characters_inventaire_recompenses_faction_parent_id_idx" ON "characters_inventaire_recompenses_faction" USING btree ("_parent_id");
  CREATE INDEX "formations_organisation_formation_idx" ON "formations" USING btree ("organisation_formation_id");
  CREATE INDEX "formations_updated_at_idx" ON "formations" USING btree ("updated_at");
  CREATE INDEX "formations_created_at_idx" ON "formations" USING btree ("created_at");
  CREATE INDEX "special_roles_updated_at_idx" ON "special_roles" USING btree ("updated_at");
  CREATE INDEX "special_roles_created_at_idx" ON "special_roles" USING btree ("created_at");
  CREATE INDEX "mods_bonus_consommables_order_idx" ON "mods_bonus_consommables" USING btree ("_order");
  CREATE INDEX "mods_bonus_consommables_parent_id_idx" ON "mods_bonus_consommables" USING btree ("_parent_id");
  CREATE INDEX "faction_reward_tiers_factions_order_idx" ON "faction_reward_tiers_factions" USING btree ("_order");
  CREATE INDEX "faction_reward_tiers_factions_parent_id_idx" ON "faction_reward_tiers_factions" USING btree ("_parent_id");
  CREATE INDEX "faction_reward_tiers_factions_faction_idx" ON "faction_reward_tiers_factions" USING btree ("faction_id");
  CREATE INDEX "faction_reward_tiers_updated_at_idx" ON "faction_reward_tiers" USING btree ("updated_at");
  CREATE INDEX "faction_reward_tiers_created_at_idx" ON "faction_reward_tiers" USING btree ("created_at");
  CREATE UNIQUE INDEX "session_rewards_batch_id_idx" ON "session_rewards" USING btree ("batch_id");
  CREATE INDEX "session_rewards_applied_by_idx" ON "session_rewards" USING btree ("applied_by_id");
  CREATE INDEX "session_rewards_group_idx" ON "session_rewards" USING btree ("group_id");
  CREATE INDEX "session_rewards_reverted_by_idx" ON "session_rewards" USING btree ("reverted_by_id");
  CREATE INDEX "session_rewards_updated_at_idx" ON "session_rewards" USING btree ("updated_at");
  CREATE INDEX "session_rewards_created_at_idx" ON "session_rewards" USING btree ("created_at");
  CREATE UNIQUE INDEX "shop_transactions_transaction_id_idx" ON "shop_transactions" USING btree ("transaction_id");
  CREATE INDEX "shop_transactions_actor_idx" ON "shop_transactions" USING btree ("actor_id");
  CREATE INDEX "shop_transactions_character_idx" ON "shop_transactions" USING btree ("character_id");
  CREATE INDEX "shop_transactions_ship_idx" ON "shop_transactions" USING btree ("ship_id");
  CREATE INDEX "shop_transactions_updated_at_idx" ON "shop_transactions" USING btree ("updated_at");
  CREATE INDEX "shop_transactions_created_at_idx" ON "shop_transactions" USING btree ("created_at");
  CREATE INDEX "createdAt_idx" ON "shop_transactions" USING btree ("created_at");
  CREATE INDEX "search_updated_at_idx" ON "search" USING btree ("updated_at");
  CREATE INDEX "search_created_at_idx" ON "search" USING btree ("created_at");
  CREATE INDEX "search_rels_order_idx" ON "search_rels" USING btree ("order");
  CREATE INDEX "search_rels_parent_idx" ON "search_rels" USING btree ("parent_id");
  CREATE INDEX "search_rels_path_idx" ON "search_rels" USING btree ("path");
  CREATE INDEX "search_rels_lore_articles_id_idx" ON "search_rels" USING btree ("lore_articles_id");
  ALTER TABLE "ships_armes_tourelles" ADD CONSTRAINT "ships_armes_tourelles_module_id_ship_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."ship_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships" ADD CONSTRAINT "ships_modele_id_ship_sale_models_id_fk" FOREIGN KEY ("modele_id") REFERENCES "public"."ship_sale_models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters_inventaire_armes" ADD CONSTRAINT "characters_inventaire_armes_chargeur_relie_id_consumables_id_fk" FOREIGN KEY ("chargeur_relie_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_principale_chargeur_relie_id_consumables_id_fk" FOREIGN KEY ("arme_principale_chargeur_relie_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_secondaire_chargeur_relie_id_consumables_id_fk" FOREIGN KEY ("arme_secondaire_chargeur_relie_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_lourde_chargeur_relie_id_consumables_id_fk" FOREIGN KEY ("arme_lourde_chargeur_relie_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_de_melee_chargeur_relie_id_consumables_id_fk" FOREIGN KEY ("arme_de_melee_chargeur_relie_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_special_roles_fk" FOREIGN KEY ("special_roles_id") REFERENCES "public"."special_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_consumables_fk" FOREIGN KEY ("consumables_id") REFERENCES "public"."consumables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "consumables" ADD CONSTRAINT "consumables_role_special_requis_id_special_roles_id_fk" FOREIGN KEY ("role_special_requis_id") REFERENCES "public"."special_roles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "chips" ADD CONSTRAINT "chips_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_formations_fk" FOREIGN KEY ("formations_id") REFERENCES "public"."formations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_special_roles_fk" FOREIGN KEY ("special_roles_id") REFERENCES "public"."special_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faction_reward_tiers_fk" FOREIGN KEY ("faction_reward_tiers_id") REFERENCES "public"."faction_reward_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_session_rewards_fk" FOREIGN KEY ("session_rewards_id") REFERENCES "public"."session_rewards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shop_transactions_fk" FOREIGN KEY ("shop_transactions_id") REFERENCES "public"."shop_transactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_fk" FOREIGN KEY ("search_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ships_armes_tourelles_module_idx" ON "ships_armes_tourelles" USING btree ("module_id");
  CREATE INDEX "characters_inventaire_armes_chargeur_relie_idx" ON "characters_inventaire_armes" USING btree ("chargeur_relie_id");
  CREATE INDEX "characters_arme_principale_arme_principale_chargeur_reli_idx" ON "characters" USING btree ("arme_principale_chargeur_relie_id");
  CREATE INDEX "characters_arme_secondaire_arme_secondaire_chargeur_reli_idx" ON "characters" USING btree ("arme_secondaire_chargeur_relie_id");
  CREATE INDEX "characters_arme_lourde_arme_lourde_chargeur_relie_idx" ON "characters" USING btree ("arme_lourde_chargeur_relie_id");
  CREATE INDEX "characters_arme_de_melee_arme_de_melee_chargeur_relie_idx" ON "characters" USING btree ("arme_de_melee_chargeur_relie_id");
  CREATE INDEX "characters_rels_special_roles_id_idx" ON "characters_rels" USING btree ("special_roles_id");
  CREATE INDEX "characters_rels_consumables_id_idx" ON "characters_rels" USING btree ("consumables_id");
  CREATE INDEX "consumables_role_special_requis_idx" ON "consumables" USING btree ("role_special_requis_id");
  CREATE INDEX "chips_image_idx" ON "chips" USING btree ("image_id");
  CREATE INDEX "payload_locked_documents_rels_formations_id_idx" ON "payload_locked_documents_rels" USING btree ("formations_id");
  CREATE INDEX "payload_locked_documents_rels_special_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("special_roles_id");
  CREATE INDEX "payload_locked_documents_rels_faction_reward_tiers_id_idx" ON "payload_locked_documents_rels" USING btree ("faction_reward_tiers_id");
  CREATE INDEX "payload_locked_documents_rels_session_rewards_id_idx" ON "payload_locked_documents_rels" USING btree ("session_rewards_id");
  CREATE INDEX "payload_locked_documents_rels_shop_transactions_id_idx" ON "payload_locked_documents_rels" USING btree ("shop_transactions_id");
  CREATE INDEX "payload_locked_documents_rels_search_id_idx" ON "payload_locked_documents_rels" USING btree ("search_id");
  ALTER TABLE "ships" DROP COLUMN "consommation_actuelle";
  ALTER TABLE "ships_rels" DROP COLUMN "ship_weapons_id";
  ALTER TABLE "ship_consumables" DROP COLUMN "categorie";
  DROP TYPE "public"."enum_ship_consumables_categorie";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ship_consumables_categorie" AS ENUM('munitions', 'cartouches', 'roquettes', 'mines', 'reparation', 'energie', 'autre');
  ALTER TABLE "ships_armes_pilote" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ships_armes_tourelles_armes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ships_inventaire_modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ships_inventaire_armes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ships_inventaire_consommables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "characters_inventaire_recompenses_faction" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "formations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "special_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mods_bonus_consommables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faction_reward_tiers_factions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faction_reward_tiers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "session_rewards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "shop_transactions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ships_armes_pilote" CASCADE;
  DROP TABLE "ships_armes_tourelles_armes" CASCADE;
  DROP TABLE "ships_inventaire_modules" CASCADE;
  DROP TABLE "ships_inventaire_armes" CASCADE;
  DROP TABLE "ships_inventaire_consommables" CASCADE;
  DROP TABLE "characters_inventaire_recompenses_faction" CASCADE;
  DROP TABLE "formations" CASCADE;
  DROP TABLE "special_roles" CASCADE;
  DROP TABLE "mods_bonus_consommables" CASCADE;
  DROP TABLE "faction_reward_tiers_factions" CASCADE;
  DROP TABLE "faction_reward_tiers" CASCADE;
  DROP TABLE "session_rewards" CASCADE;
  DROP TABLE "shop_transactions" CASCADE;
  DROP TABLE "search" CASCADE;
  DROP TABLE "search_rels" CASCADE;
  ALTER TABLE "ships_armes_tourelles" DROP CONSTRAINT "ships_armes_tourelles_module_id_ship_modules_id_fk";
  
  ALTER TABLE "ships" DROP CONSTRAINT "ships_modele_id_ship_sale_models_id_fk";
  
  ALTER TABLE "characters_inventaire_armes" DROP CONSTRAINT "characters_inventaire_armes_chargeur_relie_id_consumables_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_principale_chargeur_relie_id_consumables_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_secondaire_chargeur_relie_id_consumables_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_lourde_chargeur_relie_id_consumables_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_de_melee_chargeur_relie_id_consumables_id_fk";
  
  ALTER TABLE "characters_rels" DROP CONSTRAINT "characters_rels_special_roles_fk";
  
  ALTER TABLE "characters_rels" DROP CONSTRAINT "characters_rels_consumables_fk";
  
  ALTER TABLE "consumables" DROP CONSTRAINT "consumables_role_special_requis_id_special_roles_id_fk";
  
  ALTER TABLE "chips" DROP CONSTRAINT "chips_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_formations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_special_roles_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faction_reward_tiers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_session_rewards_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_shop_transactions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_search_fk";
  
  ALTER TABLE "mods" ALTER COLUMN "sous_categorie_armure" SET DATA TYPE text;
  DROP TYPE "public"."enum_mods_sous_categorie_armure";
  CREATE TYPE "public"."enum_mods_sous_categorie_armure" AS ENUM('toutes', 'tete', 'torse', 'bras', 'jambes');
  ALTER TABLE "mods" ALTER COLUMN "sous_categorie_armure" SET DATA TYPE "public"."enum_mods_sous_categorie_armure" USING "sous_categorie_armure"::"public"."enum_mods_sous_categorie_armure";
  DROP INDEX "ships_armes_tourelles_module_idx";
  DROP INDEX "characters_inventaire_armes_chargeur_relie_idx";
  DROP INDEX "characters_arme_principale_arme_principale_chargeur_reli_idx";
  DROP INDEX "characters_arme_secondaire_arme_secondaire_chargeur_reli_idx";
  DROP INDEX "characters_arme_lourde_arme_lourde_chargeur_relie_idx";
  DROP INDEX "characters_arme_de_melee_arme_de_melee_chargeur_relie_idx";
  DROP INDEX "characters_rels_special_roles_id_idx";
  DROP INDEX "characters_rels_consumables_id_idx";
  DROP INDEX "consumables_role_special_requis_idx";
  DROP INDEX "chips_image_idx";
  DROP INDEX "payload_locked_documents_rels_formations_id_idx";
  DROP INDEX "payload_locked_documents_rels_special_roles_id_idx";
  DROP INDEX "payload_locked_documents_rels_faction_reward_tiers_id_idx";
  DROP INDEX "payload_locked_documents_rels_session_rewards_id_idx";
  DROP INDEX "payload_locked_documents_rels_shop_transactions_id_idx";
  DROP INDEX "payload_locked_documents_rels_search_id_idx";
  ALTER TABLE "ships" ADD COLUMN "consommation_actuelle" numeric;
  ALTER TABLE "ships_rels" ADD COLUMN "ship_weapons_id" integer;
  ALTER TABLE "ship_consumables" ADD COLUMN "categorie" "enum_ship_consumables_categorie";
  ALTER TABLE "ships" ADD CONSTRAINT "ships_modele_id_ship_models_id_fk" FOREIGN KEY ("modele_id") REFERENCES "public"."ship_models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ships_rels" ADD CONSTRAINT "ships_rels_ship_weapons_fk" FOREIGN KEY ("ship_weapons_id") REFERENCES "public"."ship_weapons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ships_rels_ship_weapons_id_idx" ON "ships_rels" USING btree ("ship_weapons_id");
  ALTER TABLE "ships_armes_tourelles" DROP COLUMN "module_id";
  ALTER TABLE "ship_consumables" DROP COLUMN "quantite_equipable";
  ALTER TABLE "armors" DROP COLUMN "rang";
  ALTER TABLE "characters_inventaire_armes" DROP COLUMN "munitions_actuelles";
  ALTER TABLE "characters_inventaire_armes" DROP COLUMN "chargeur_relie_id";
  ALTER TABLE "characters" DROP COLUMN "creation_etape";
  ALTER TABLE "characters" DROP COLUMN "creation_jets";
  ALTER TABLE "characters" DROP COLUMN "utilisations_kits_reparation";
  ALTER TABLE "characters" DROP COLUMN "utilisations_kits_soins";
  ALTER TABLE "characters" DROP COLUMN "coaching_force_label";
  ALTER TABLE "characters" DROP COLUMN "coaching_force_max";
  ALTER TABLE "characters" DROP COLUMN "coaching_force_value";
  ALTER TABLE "characters" DROP COLUMN "coaching_habilite_label";
  ALTER TABLE "characters" DROP COLUMN "coaching_habilite_max";
  ALTER TABLE "characters" DROP COLUMN "coaching_habilite_value";
  ALTER TABLE "characters" DROP COLUMN "coaching_connaissances_label";
  ALTER TABLE "characters" DROP COLUMN "coaching_connaissances_max";
  ALTER TABLE "characters" DROP COLUMN "coaching_connaissances_value";
  ALTER TABLE "characters" DROP COLUMN "coaching_culture_label";
  ALTER TABLE "characters" DROP COLUMN "coaching_culture_max";
  ALTER TABLE "characters" DROP COLUMN "coaching_culture_value";
  ALTER TABLE "characters" DROP COLUMN "coaching_anticipation_label";
  ALTER TABLE "characters" DROP COLUMN "coaching_anticipation_max";
  ALTER TABLE "characters" DROP COLUMN "coaching_anticipation_value";
  ALTER TABLE "characters" DROP COLUMN "coaching_perception_label";
  ALTER TABLE "characters" DROP COLUMN "coaching_perception_max";
  ALTER TABLE "characters" DROP COLUMN "coaching_perception_value";
  ALTER TABLE "characters" DROP COLUMN "arme_principale_munitions_actuelles";
  ALTER TABLE "characters" DROP COLUMN "arme_principale_chargeur_relie_id";
  ALTER TABLE "characters" DROP COLUMN "arme_secondaire_munitions_actuelles";
  ALTER TABLE "characters" DROP COLUMN "arme_secondaire_chargeur_relie_id";
  ALTER TABLE "characters" DROP COLUMN "arme_lourde_munitions_actuelles";
  ALTER TABLE "characters" DROP COLUMN "arme_lourde_chargeur_relie_id";
  ALTER TABLE "characters" DROP COLUMN "arme_de_melee_munitions_actuelles";
  ALTER TABLE "characters" DROP COLUMN "arme_de_melee_chargeur_relie_id";
  ALTER TABLE "characters_rels" DROP COLUMN "special_roles_id";
  ALTER TABLE "characters_rels" DROP COLUMN "consumables_id";
  ALTER TABLE "consumables" DROP COLUMN "taille";
  ALTER TABLE "consumables" DROP COLUMN "type_munition";
  ALTER TABLE "consumables" DROP COLUMN "role_special_requis_id";
  ALTER TABLE "chips" DROP COLUMN "image_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "formations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "special_roles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faction_reward_tiers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "session_rewards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "shop_transactions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "search_id";
  DROP TYPE "public"."enum_characters_inventaire_recompenses_faction_type_recompense";
  DROP TYPE "public"."enum_characters_inventaire_recompenses_faction_usage";
  DROP TYPE "public"."enum_characters_creation_etape";
  DROP TYPE "public"."enum_formations_competence";
  DROP TYPE "public"."enum_mods_bonus_consommables_categorie";
  DROP TYPE "public"."enum_consumables_type_munition";
  DROP TYPE "public"."enum_faction_reward_tiers_factions_application";
  DROP TYPE "public"."enum_faction_reward_tiers_type_recompense";
  DROP TYPE "public"."enum_session_rewards_scope_type";`)
}
