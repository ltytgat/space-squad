import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ship_modules_bonus_calcul_cible" AS ENUM('esquive', 'tir-pilote', 'pilotage', 'analyse');
  ALTER TABLE "ship_modules" ADD COLUMN "bonus_calcul_cible" "enum_ship_modules_bonus_calcul_cible" DEFAULT 'esquive' NOT NULL;
  ALTER TABLE "ship_modules" ADD COLUMN "bonus_calcul_valeur" numeric DEFAULT 0 NOT NULL;
  ALTER TABLE "ship_modules" ALTER COLUMN "bonus_calcul_cible" DROP DEFAULT;
  ALTER TABLE "ship_modules" ALTER COLUMN "bonus_calcul_valeur" DROP DEFAULT;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ship_modules" DROP COLUMN "bonus_calcul_cible";
  ALTER TABLE "ship_modules" DROP COLUMN "bonus_calcul_valeur";
  DROP TYPE "public"."enum_ship_modules_bonus_calcul_cible";`)
}
