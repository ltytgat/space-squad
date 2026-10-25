import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "atelier_modifications_effets" ALTER COLUMN "cible" SET DATA TYPE text;
  DROP TYPE "public"."enum_atelier_modifications_effets_cible";
  CREATE TYPE "public"."enum_atelier_modifications_effets_cible" AS ENUM('poids', 'prix', 'valeurDegats', 'zoneEffet', 'projectilesParTir', 'tempsRechargement', 'porteeFixe', 'courtePortee', 'modCourtePortee', 'moyennePortee', 'modMoyennePortee', 'trancheMalusLonguePortee', 'malusParTranche', 'tailleChargeur', 'valeurChauffe', 'tempsRefroidissement', 'weaponHeatSegment', 'valeurArmurePhysique', 'valeurBouclier', 'valeurRupture', 'tourelles', 'pointsEmportPilote', 'pointsEmportTourelles', 'blindage', 'modulesSupplementaires', 'consommables', 'esquiveBase');
  ALTER TABLE "atelier_modifications_effets" ALTER COLUMN "cible" SET DATA TYPE "public"."enum_atelier_modifications_effets_cible" USING "cible"::"public"."enum_atelier_modifications_effets_cible";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "atelier_modifications_effets" ALTER COLUMN "cible" SET DATA TYPE text;
  DROP TYPE "public"."enum_atelier_modifications_effets_cible";
  CREATE TYPE "public"."enum_atelier_modifications_effets_cible" AS ENUM('nom', 'fabricant', 'categorie', 'type', 'poids', 'prix', 'forceMinimum', 'valeurDegats', 'zoneEffet', 'projectilesParTir', 'tempsRechargement', 'porteeFixe', 'courtePortee', 'modCourtePortee', 'moyennePortee', 'modMoyennePortee', 'paliersSniper', 'trancheMalusLonguePortee', 'malusParTranche', 'tailleChargeur', 'valeurChauffe', 'tempsRefroidissement', 'valeurArmurePhysique', 'valeurBouclier', 'valeurRupture', 'modificateur', 'stockage', 'set', 'image', 'classe', 'tourelles', 'pointsEmportPilote', 'pointsEmportTourelles', 'blindage', 'modulesSupplementaires', 'consommables', 'esquiveBase');
  ALTER TABLE "atelier_modifications_effets" ALTER COLUMN "cible" SET DATA TYPE "public"."enum_atelier_modifications_effets_cible" USING "cible"::"public"."enum_atelier_modifications_effets_cible";`)
}
