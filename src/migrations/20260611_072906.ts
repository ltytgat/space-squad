import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'chargeur_pct' BEFORE 'poids';
  ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE 'refroidissement_pct' BEFORE 'indicator_surcharge';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mods_modificateurs" ALTER COLUMN "cible" SET DATA TYPE text;
  DROP TYPE "public"."enum_mods_modificateurs_cible";
  CREATE TYPE "public"."enum_mods_modificateurs_cible" AS ENUM('stat_force', 'stat_habilite', 'stat_connaissances', 'stat_culture', 'stat_anticipation', 'stat_perception', 'armure_physique', 'armure_bouclier', 'armure_rupture', 'degats_flat', 'degats_mod_fo_x1', 'degats_mod_pe_x1', 'portee_courte', 'portee_moyenne', 'mod_portee_courte', 'mod_portee_moyenne', 'chargeur', 'poids', 'indicator_surcharge', 'indicator_projectiles', 'indicator_acide', 'indicator_tazer', 'indicator_gravite_faible', 'indicator_gravite_forte', 'indicator_lumiere', 'indicator_double_pistolet');
  ALTER TABLE "mods_modificateurs" ALTER COLUMN "cible" SET DATA TYPE "public"."enum_mods_modificateurs_cible" USING "cible"::"public"."enum_mods_modificateurs_cible";`)
}
