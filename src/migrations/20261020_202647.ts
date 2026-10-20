import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "armor_sets" ADD COLUMN "rang" numeric;
  CREATE UNIQUE INDEX "armor_sets_rang_idx" ON "armor_sets" USING btree ("rang");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "armor_sets_rang_idx";
  ALTER TABLE "armor_sets" DROP COLUMN "rang";`)
}
