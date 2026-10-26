import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_atelier_modifications_effets_cible" ADD VALUE 'caracteristiqueBonus' BEFORE 'tourelles';
  ALTER TYPE "public"."enum_atelier_modifications_effets_cible" ADD VALUE 'mods' BEFORE 'tourelles';
  ALTER TYPE "public"."enum_atelier_modifications_effets_cible" ADD VALUE 'specializationCombat' BEFORE 'tourelles';
  ALTER TYPE "public"."enum_atelier_modifications_effets_cible" ADD VALUE 'specializationExploration' BEFORE 'tourelles';
  ALTER TYPE "public"."enum_atelier_modifications_effets_cible" ADD VALUE 'specializationTransport' BEFORE 'tourelles';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "atelier_modifications_effets" ALTER COLUMN "cible" SET DATA TYPE text;
  DROP TYPE "public"."enum_atelier_modifications_effets_cible";
  CREATE TYPE "public"."enum_atelier_modifications_effets_cible" AS ENUM('poids', 'prix', 'valeurDegats', 'zoneEffet', 'projectilesParTir', 'tempsRechargement', 'porteeFixe', 'courtePortee', 'modCourtePortee', 'moyennePortee', 'modMoyennePortee', 'trancheMalusLonguePortee', 'malusParTranche', 'tailleChargeur', 'valeurChauffe', 'tempsRefroidissement', 'weaponHeatSegment', 'valeurArmurePhysique', 'valeurBouclier', 'valeurRupture', 'tourelles', 'pointsEmportPilote', 'pointsEmportTourelles', 'blindage', 'modulesSupplementaires', 'consommables', 'esquiveBase');
  ALTER TABLE "atelier_modifications_effets" ALTER COLUMN "cible" SET DATA TYPE "public"."enum_atelier_modifications_effets_cible" USING "cible"::"public"."enum_atelier_modifications_effets_cible";`)
}
