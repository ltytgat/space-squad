import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lore_articles" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_lore_articles_category";
  CREATE TYPE "public"."enum_lore_articles_category" AS ENUM('chronologies', 'especes-non-humaines', 'politique', 'technologie', 'chroniques', 'culture', 'stardash');
  ALTER TABLE "lore_articles" ALTER COLUMN "category" SET DATA TYPE "public"."enum_lore_articles_category" USING "category"::"public"."enum_lore_articles_category";
  ALTER TABLE "_lore_articles_v" ALTER COLUMN "version_category" SET DATA TYPE text;
  DROP TYPE "public"."enum__lore_articles_v_version_category";
  CREATE TYPE "public"."enum__lore_articles_v_version_category" AS ENUM('chronologies', 'especes-non-humaines', 'politique', 'technologie', 'chroniques', 'culture', 'stardash');
  ALTER TABLE "_lore_articles_v" ALTER COLUMN "version_category" SET DATA TYPE "public"."enum__lore_articles_v_version_category" USING "version_category"::"public"."enum__lore_articles_v_version_category";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lore_articles" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_lore_articles_category";
  CREATE TYPE "public"."enum_lore_articles_category" AS ENUM('chronologies', 'especes-non-humaines', 'politique', 'technologie', 'culture', 'stardash', 'chroniques');
  ALTER TABLE "lore_articles" ALTER COLUMN "category" SET DATA TYPE "public"."enum_lore_articles_category" USING "category"::"public"."enum_lore_articles_category";
  ALTER TABLE "_lore_articles_v" ALTER COLUMN "version_category" SET DATA TYPE text;
  DROP TYPE "public"."enum__lore_articles_v_version_category";
  CREATE TYPE "public"."enum__lore_articles_v_version_category" AS ENUM('chronologies', 'especes-non-humaines', 'politique', 'technologie', 'culture', 'stardash', 'chroniques');
  ALTER TABLE "_lore_articles_v" ALTER COLUMN "version_category" SET DATA TYPE "public"."enum__lore_articles_v_version_category" USING "version_category"::"public"."enum__lore_articles_v_version_category";`)
}
