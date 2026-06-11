import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_pilotage_leger';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_pilotage_intermediaire';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_pilotage_lourd';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_pilotage_blinde';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_tir_pilote';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_tir_tourelle';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_tir_vehicule';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_reparation';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_negocier';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_analyse';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_culture';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_discretion';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_initiative';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_tir_assaut';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_tir_sniper';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_tir_shotgun';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_cac';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'epreuve_soins';
  CREATE TABLE "characters_inventaire" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"consommable_id" integer NOT NULL,
  	"quantite" numeric DEFAULT 1 NOT NULL
  );
  
  ALTER TABLE "consumables" ADD COLUMN "modificateur_epreuve" numeric;
  ALTER TABLE "characters_inventaire" ADD CONSTRAINT "characters_inventaire_consommable_id_consumables_id_fk" FOREIGN KEY ("consommable_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters_inventaire" ADD CONSTRAINT "characters_inventaire_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "characters_inventaire_order_idx" ON "characters_inventaire" USING btree ("_order");
  CREATE INDEX "characters_inventaire_parent_id_idx" ON "characters_inventaire" USING btree ("_parent_id");
  CREATE INDEX "characters_inventaire_consommable_idx" ON "characters_inventaire" USING btree ("consommable_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "characters_inventaire" CASCADE;
  ALTER TABLE "mods_modificateurs" ALTER COLUMN "cible" SET DATA TYPE text;
  DROP TYPE "public"."enum_mods_modificateurs_cible";
  CREATE TYPE "public"."enum_mods_modificateurs_cible" AS ENUM('stat_force', 'stat_habilite', 'stat_connaissances', 'stat_culture', 'stat_anticipation', 'stat_perception', 'armure_physique', 'armure_bouclier', 'armure_rupture', 'degats_flat', 'degats_mod_fo_x1', 'degats_mod_pe_x1', 'portee_courte', 'portee_moyenne', 'mod_portee_courte', 'mod_portee_moyenne', 'chargeur', 'chargeur_pct', 'poids', 'refroidissement_pct', 'indicator_surcharge', 'indicator_projectiles', 'indicator_acide', 'indicator_tazer', 'indicator_gravite_faible', 'indicator_gravite_forte', 'indicator_lumiere', 'indicator_double_pistolet');
  ALTER TABLE "mods_modificateurs" ALTER COLUMN "cible" SET DATA TYPE "public"."enum_mods_modificateurs_cible" USING "cible"::"public"."enum_mods_modificateurs_cible";
  ALTER TABLE "consumables" DROP COLUMN "modificateur_epreuve";`)
}
