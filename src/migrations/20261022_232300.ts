import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "characters_user_idx";
    CREATE INDEX "characters_user_idx" ON "characters" USING btree ("user_id");
    ALTER TABLE "shop_transactions" ALTER COLUMN "character_id" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM "characters"
        WHERE "user_id" IS NOT NULL
        GROUP BY "user_id"
        HAVING COUNT(*) > 1
      ) THEN
        RAISE EXCEPTION 'Cannot restore one-character-per-user while accounts own multiple characters';
      END IF;
      IF EXISTS (SELECT 1 FROM "shop_transactions" WHERE "character_id" IS NULL) THEN
        RAISE EXCEPTION 'Cannot require shop transaction character references after characters were deleted';
      END IF;
    END $$;
    ALTER TABLE "shop_transactions" ALTER COLUMN "character_id" SET NOT NULL;
    DROP INDEX IF EXISTS "characters_user_idx";
    CREATE UNIQUE INDEX "characters_user_idx" ON "characters" USING btree ("user_id");
  `)
}
