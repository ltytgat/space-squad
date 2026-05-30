import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "weapons" ADD COLUMN "valeur_chauffe" numeric;
  ALTER TABLE "weapons" ADD COLUMN "zone_effet" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "weapons" DROP COLUMN "valeur_chauffe";
  ALTER TABLE "weapons" DROP COLUMN "zone_effet";`)
}
