import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS "public"."ship_models_nom_idx";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM "ship_models" GROUP BY "nom" HAVING COUNT(*) > 1
      ) THEN
        RAISE EXCEPTION 'Cannot restore unique ship chassis names while duplicate names exist. Rename duplicates before rolling back.';
      END IF;
      CREATE UNIQUE INDEX "ship_models_nom_idx" ON "ship_models" USING btree ("nom");
    END $$;
  `)
}
