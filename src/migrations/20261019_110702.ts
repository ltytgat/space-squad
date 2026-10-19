import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_vehicle_sale_models_tourelle_classe_max" ADD VALUE 'gamma';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vehicle_sale_models" ALTER COLUMN "tourelle_classe_max" SET DATA TYPE text;
  DROP TYPE "public"."enum_vehicle_sale_models_tourelle_classe_max";
  CREATE TYPE "public"."enum_vehicle_sale_models_tourelle_classe_max" AS ENUM('alpha', 'beta');
  ALTER TABLE "vehicle_sale_models" ALTER COLUMN "tourelle_classe_max" SET DATA TYPE "public"."enum_vehicle_sale_models_tourelle_classe_max" USING "tourelle_classe_max"::"public"."enum_vehicle_sale_models_tourelle_classe_max";`)
}
