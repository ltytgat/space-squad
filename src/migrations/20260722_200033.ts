import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_ship_modules_famille" ADD VALUE 'cabines-equipage';
  ALTER TYPE "public"."enum_ship_modules_famille" ADD VALUE '_tourelles_header';
  ALTER TYPE "public"."enum_ship_modules_famille" ADD VALUE 'bombardement';
  ALTER TYPE "public"."enum_ship_modules_famille" ADD VALUE 'shotgun';
  ALTER TYPE "public"."enum_ship_modules_famille" ADD VALUE 'tir-concentre';
  ALTER TYPE "public"."enum_ship_modules_famille" ADD VALUE 'dispersion';
  ALTER TYPE "public"."enum_ship_modules_type_module" ADD VALUE 'tourelle';
  ALTER TABLE "ship_modules" ADD COLUMN "consommation_par_personne" numeric;
  ALTER TABLE "ship_modules" ADD COLUMN "nombre_places" numeric;
  ALTER TABLE "ship_modules" ADD COLUMN "consommation_supplementaire" numeric;
  ALTER TABLE "ship_modules" ADD COLUMN "portee" varchar;
  ALTER TABLE "ship_modules" ADD COLUMN "bonus_degats_pourcentage" numeric;
  ALTER TABLE "ship_modules" ADD COLUMN "bonus_degats_par100_m_j" numeric;
  ALTER TABLE "ship_modules" ADD COLUMN "mj_max_utilisable" numeric;
  ALTER TABLE "ship_modules" ADD COLUMN "angle_tir" varchar;
  ALTER TABLE "ship_weapons" DROP COLUMN "moyenne";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ship_modules" ALTER COLUMN "famille" SET DATA TYPE text;
  DROP TYPE "public"."enum_ship_modules_famille";
  CREATE TYPE "public"."enum_ship_modules_famille" AS ENUM('_base_header', 'generateur', 'propulseurs', 'survie', 'boucliers', '_supp_header', 'blindage', 'reparateur', 'hangar', 'scanner', 'infirmerie', 'sas-abordage', 'ordinateur-tir', 'harmonisateur', 'baie-amarrage', 'pilotage-assiste', 'propulseurs-stardash');
  ALTER TABLE "ship_modules" ALTER COLUMN "famille" SET DATA TYPE "public"."enum_ship_modules_famille" USING "famille"::"public"."enum_ship_modules_famille";
  ALTER TABLE "ship_modules" ALTER COLUMN "type_module" SET DATA TYPE text;
  DROP TYPE "public"."enum_ship_modules_type_module";
  CREATE TYPE "public"."enum_ship_modules_type_module" AS ENUM('base', 'supplementaire');
  ALTER TABLE "ship_modules" ALTER COLUMN "type_module" SET DATA TYPE "public"."enum_ship_modules_type_module" USING "type_module"::"public"."enum_ship_modules_type_module";
  ALTER TABLE "ship_weapons" ADD COLUMN "moyenne" numeric;
  ALTER TABLE "ship_modules" DROP COLUMN "consommation_par_personne";
  ALTER TABLE "ship_modules" DROP COLUMN "nombre_places";
  ALTER TABLE "ship_modules" DROP COLUMN "consommation_supplementaire";
  ALTER TABLE "ship_modules" DROP COLUMN "portee";
  ALTER TABLE "ship_modules" DROP COLUMN "bonus_degats_pourcentage";
  ALTER TABLE "ship_modules" DROP COLUMN "bonus_degats_par100_m_j";
  ALTER TABLE "ship_modules" DROP COLUMN "mj_max_utilisable";
  ALTER TABLE "ship_modules" DROP COLUMN "angle_tir";`)
}
