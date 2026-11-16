import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_characters_competences_competence" ADD VALUE IF NOT EXISTS 'Grenadier' AFTER 'Shotgun';
    ALTER TYPE "public"."enum_formations_competence" ADD VALUE IF NOT EXISTS 'Grenadier' AFTER 'Shotgun';
    ALTER TYPE "public"."enum_mods_modificateurs_cible" ADD VALUE IF NOT EXISTS 'epreuve_lancer_grenade' AFTER 'epreuve_tir_shotgun';
  `)
}

export async function down(): Promise<void> {
  // PostgreSQL cannot remove enum values directly. Keep these additive values
  // so a rollback preserves existing skills, formations and equipment bonuses.
}
