import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters" ADD COLUMN "malus_force" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "malus_habilite" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "malus_connaissances" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "malus_culture" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "malus_anticipation" numeric DEFAULT 0;
  ALTER TABLE "characters" ADD COLUMN "malus_perception" numeric DEFAULT 0;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters" DROP COLUMN "malus_force";
  ALTER TABLE "characters" DROP COLUMN "malus_habilite";
  ALTER TABLE "characters" DROP COLUMN "malus_connaissances";
  ALTER TABLE "characters" DROP COLUMN "malus_culture";
  ALTER TABLE "characters" DROP COLUMN "malus_anticipation";
  ALTER TABLE "characters" DROP COLUMN "malus_perception";`)
}
