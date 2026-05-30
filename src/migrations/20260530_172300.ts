import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'player');
  CREATE TYPE "public"."enum_lore_articles_category" AS ENUM('chronologies', 'especes-non-humaines', 'politique', 'technologie', 'culture', 'stardash');
  CREATE TYPE "public"."enum_lore_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lore_articles_v_version_category" AS ENUM('chronologies', 'especes-non-humaines', 'politique', 'technologie', 'culture', 'stardash');
  CREATE TYPE "public"."enum__lore_articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_ships_classe" AS ENUM('alpha', 'beta', 'gamma', 'delta');
  CREATE TYPE "public"."enum_weapons_type" AS ENUM('thermique', 'cinetique', 'plasma', 'explosif', 'melee');
  CREATE TYPE "public"."enum_weapons_categorie" AS ENUM('fusil-assaut', 'shotgun', 'sniper', 'pistolet', 'melee', 'lourde');
  CREATE TYPE "public"."enum_characters_competences_competence" AS ENUM('Chasseur', 'Bombardier', 'Poids Lourds', 'Transport de Troupes', 'Canonnier', 'Médecine de terrain', 'Concentration', 'Mécanicien', 'Stabilisation', 'Assaut', 'Sniper', 'Shotgun', 'Combat rapproché', 'Analyse', 'Réactivité', 'Furtivité', 'Diplomate', 'Culture');
  CREATE TYPE "public"."enum_characters_sexe" AS ENUM('M', 'F', 'X');
  CREATE TYPE "public"."enum_characters_origine" AS ENUM('Humain', 'Strani', 'Vada');
  CREATE TYPE "public"."enum_characters_affiliation" AS ENUM('Alliance', 'Union', 'Guilde');
  CREATE TYPE "public"."enum_characters_role_vaisseau" AS ENUM('proprietaire', 'passager');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'player' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"content" jsonb,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "lore_articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"category" "enum_lore_articles_category",
  	"excerpt" varchar,
  	"cover_id" integer,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_lore_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_lore_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_category" "enum__lore_articles_v_version_category",
  	"version_excerpt" varchar,
  	"version_cover_id" integer,
  	"version_content" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__lore_articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ships" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"classe" "enum_ships_classe",
  	"modele" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "weapons_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_weapons_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "weapons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"fabricant" varchar,
  	"categorie" "enum_weapons_categorie" NOT NULL,
  	"valeur_degats" numeric,
  	"poids" numeric,
  	"prix" numeric,
  	"portee" numeric,
  	"projectiles_par_tir" numeric DEFAULT 1,
  	"taille_chargeur" numeric,
  	"temps_rechargement" numeric,
  	"temps_refroidissement" numeric,
  	"mods" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "armors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"valeur_armure_physique" numeric,
  	"valeur_bouclier" numeric,
  	"modificateur" numeric,
  	"valeur_rupture" numeric,
  	"mods" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "characters_competences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"competence" "enum_characters_competences_competence" NOT NULL,
  	"valeur" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "characters_competences_speciales" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"valeur" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "characters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"nom" varchar,
  	"sexe" "enum_characters_sexe",
  	"origine" "enum_characters_origine",
  	"affiliation" "enum_characters_affiliation",
  	"groupe_id" integer,
  	"points_de_rang" numeric DEFAULT 0,
  	"konis" numeric DEFAULT 0,
  	"legende" numeric DEFAULT 0,
  	"force" numeric DEFAULT 0,
  	"habilite" numeric DEFAULT 0,
  	"connaissances" numeric DEFAULT 0,
  	"culture" numeric DEFAULT 0,
  	"anticipation" numeric DEFAULT 0,
  	"perception" numeric DEFAULT 0,
  	"armure_tete_id" integer,
  	"armure_torse_id" integer,
  	"armure_bras_id" integer,
  	"armure_jambes_id" integer,
  	"arme_principale_id" integer,
  	"arme_secondaire_id" integer,
  	"arme_lourde_id" integer,
  	"arme_de_poing_id" integer,
  	"arme_de_melee_id" integer,
  	"backpack" varchar,
  	"vaisseau_id" integer,
  	"role_vaisseau" "enum_characters_role_vaisseau",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"pages_id" integer,
  	"lore_articles_id" integer,
  	"groups_id" integer,
  	"ships_id" integer,
  	"weapons_id" integer,
  	"armors_id" integer,
  	"characters_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lore_articles" ADD CONSTRAINT "lore_articles_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lore_articles_v" ADD CONSTRAINT "_lore_articles_v_parent_id_lore_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lore_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lore_articles_v" ADD CONSTRAINT "_lore_articles_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "weapons_type" ADD CONSTRAINT "weapons_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."weapons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_competences" ADD CONSTRAINT "characters_competences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_competences_speciales" ADD CONSTRAINT "characters_competences_speciales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_groupe_id_groups_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_tete_id_armors_id_fk" FOREIGN KEY ("armure_tete_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_torse_id_armors_id_fk" FOREIGN KEY ("armure_torse_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_bras_id_armors_id_fk" FOREIGN KEY ("armure_bras_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_jambes_id_armors_id_fk" FOREIGN KEY ("armure_jambes_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_principale_id_weapons_id_fk" FOREIGN KEY ("arme_principale_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_secondaire_id_weapons_id_fk" FOREIGN KEY ("arme_secondaire_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_lourde_id_weapons_id_fk" FOREIGN KEY ("arme_lourde_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_de_poing_id_weapons_id_fk" FOREIGN KEY ("arme_de_poing_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_de_melee_id_weapons_id_fk" FOREIGN KEY ("arme_de_melee_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_vaisseau_id_ships_id_fk" FOREIGN KEY ("vaisseau_id") REFERENCES "public"."ships"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lore_articles_fk" FOREIGN KEY ("lore_articles_id") REFERENCES "public"."lore_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_groups_fk" FOREIGN KEY ("groups_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ships_fk" FOREIGN KEY ("ships_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_weapons_fk" FOREIGN KEY ("weapons_id") REFERENCES "public"."weapons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_armors_fk" FOREIGN KEY ("armors_id") REFERENCES "public"."armors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_characters_fk" FOREIGN KEY ("characters_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "lore_articles_slug_idx" ON "lore_articles" USING btree ("slug");
  CREATE INDEX "lore_articles_cover_idx" ON "lore_articles" USING btree ("cover_id");
  CREATE INDEX "lore_articles_updated_at_idx" ON "lore_articles" USING btree ("updated_at");
  CREATE INDEX "lore_articles_created_at_idx" ON "lore_articles" USING btree ("created_at");
  CREATE INDEX "lore_articles__status_idx" ON "lore_articles" USING btree ("_status");
  CREATE INDEX "_lore_articles_v_parent_idx" ON "_lore_articles_v" USING btree ("parent_id");
  CREATE INDEX "_lore_articles_v_version_version_slug_idx" ON "_lore_articles_v" USING btree ("version_slug");
  CREATE INDEX "_lore_articles_v_version_version_cover_idx" ON "_lore_articles_v" USING btree ("version_cover_id");
  CREATE INDEX "_lore_articles_v_version_version_updated_at_idx" ON "_lore_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_lore_articles_v_version_version_created_at_idx" ON "_lore_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_lore_articles_v_version_version__status_idx" ON "_lore_articles_v" USING btree ("version__status");
  CREATE INDEX "_lore_articles_v_created_at_idx" ON "_lore_articles_v" USING btree ("created_at");
  CREATE INDEX "_lore_articles_v_updated_at_idx" ON "_lore_articles_v" USING btree ("updated_at");
  CREATE INDEX "_lore_articles_v_latest_idx" ON "_lore_articles_v" USING btree ("latest");
  CREATE INDEX "groups_updated_at_idx" ON "groups" USING btree ("updated_at");
  CREATE INDEX "groups_created_at_idx" ON "groups" USING btree ("created_at");
  CREATE INDEX "ships_updated_at_idx" ON "ships" USING btree ("updated_at");
  CREATE INDEX "ships_created_at_idx" ON "ships" USING btree ("created_at");
  CREATE INDEX "weapons_type_order_idx" ON "weapons_type" USING btree ("order");
  CREATE INDEX "weapons_type_parent_idx" ON "weapons_type" USING btree ("parent_id");
  CREATE INDEX "weapons_updated_at_idx" ON "weapons" USING btree ("updated_at");
  CREATE INDEX "weapons_created_at_idx" ON "weapons" USING btree ("created_at");
  CREATE INDEX "armors_updated_at_idx" ON "armors" USING btree ("updated_at");
  CREATE INDEX "armors_created_at_idx" ON "armors" USING btree ("created_at");
  CREATE INDEX "characters_competences_order_idx" ON "characters_competences" USING btree ("_order");
  CREATE INDEX "characters_competences_parent_id_idx" ON "characters_competences" USING btree ("_parent_id");
  CREATE INDEX "characters_competences_speciales_order_idx" ON "characters_competences_speciales" USING btree ("_order");
  CREATE INDEX "characters_competences_speciales_parent_id_idx" ON "characters_competences_speciales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "characters_user_idx" ON "characters" USING btree ("user_id");
  CREATE INDEX "characters_groupe_idx" ON "characters" USING btree ("groupe_id");
  CREATE INDEX "characters_armure_tete_idx" ON "characters" USING btree ("armure_tete_id");
  CREATE INDEX "characters_armure_torse_idx" ON "characters" USING btree ("armure_torse_id");
  CREATE INDEX "characters_armure_bras_idx" ON "characters" USING btree ("armure_bras_id");
  CREATE INDEX "characters_armure_jambes_idx" ON "characters" USING btree ("armure_jambes_id");
  CREATE INDEX "characters_arme_principale_idx" ON "characters" USING btree ("arme_principale_id");
  CREATE INDEX "characters_arme_secondaire_idx" ON "characters" USING btree ("arme_secondaire_id");
  CREATE INDEX "characters_arme_lourde_idx" ON "characters" USING btree ("arme_lourde_id");
  CREATE INDEX "characters_arme_de_poing_idx" ON "characters" USING btree ("arme_de_poing_id");
  CREATE INDEX "characters_arme_de_melee_idx" ON "characters" USING btree ("arme_de_melee_id");
  CREATE INDEX "characters_vaisseau_idx" ON "characters" USING btree ("vaisseau_id");
  CREATE INDEX "characters_updated_at_idx" ON "characters" USING btree ("updated_at");
  CREATE INDEX "characters_created_at_idx" ON "characters" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_lore_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("lore_articles_id");
  CREATE INDEX "payload_locked_documents_rels_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("groups_id");
  CREATE INDEX "payload_locked_documents_rels_ships_id_idx" ON "payload_locked_documents_rels" USING btree ("ships_id");
  CREATE INDEX "payload_locked_documents_rels_weapons_id_idx" ON "payload_locked_documents_rels" USING btree ("weapons_id");
  CREATE INDEX "payload_locked_documents_rels_armors_id_idx" ON "payload_locked_documents_rels" USING btree ("armors_id");
  CREATE INDEX "payload_locked_documents_rels_characters_id_idx" ON "payload_locked_documents_rels" USING btree ("characters_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "lore_articles" CASCADE;
  DROP TABLE "_lore_articles_v" CASCADE;
  DROP TABLE "groups" CASCADE;
  DROP TABLE "ships" CASCADE;
  DROP TABLE "weapons_type" CASCADE;
  DROP TABLE "weapons" CASCADE;
  DROP TABLE "armors" CASCADE;
  DROP TABLE "characters_competences" CASCADE;
  DROP TABLE "characters_competences_speciales" CASCADE;
  DROP TABLE "characters" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_lore_articles_category";
  DROP TYPE "public"."enum_lore_articles_status";
  DROP TYPE "public"."enum__lore_articles_v_version_category";
  DROP TYPE "public"."enum__lore_articles_v_version_status";
  DROP TYPE "public"."enum_ships_classe";
  DROP TYPE "public"."enum_weapons_type";
  DROP TYPE "public"."enum_weapons_categorie";
  DROP TYPE "public"."enum_characters_competences_competence";
  DROP TYPE "public"."enum_characters_sexe";
  DROP TYPE "public"."enum_characters_origine";
  DROP TYPE "public"."enum_characters_affiliation";
  DROP TYPE "public"."enum_characters_role_vaisseau";`)
}
