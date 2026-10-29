import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "public"."groups" ADD COLUMN IF NOT EXISTS "shop_policy" jsonb;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "public"."groups" DROP COLUMN IF EXISTS "shop_policy";`)
}
