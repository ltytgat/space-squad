import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "public"."ship_sale_models_nom_idx";
    CREATE UNIQUE INDEX "ship_sale_models_nom_idx"
      ON "public"."ship_sale_models" USING btree ("nom")
      WHERE ("atelier_prive" IS NOT TRUE);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM "ship_sale_models" GROUP BY "nom" HAVING COUNT(*) > 1
      ) THEN
        RAISE EXCEPTION 'Cannot restore global unique ship sale model names while duplicate names exist. Rename duplicate private Atelier models before rolling back.';
      END IF;
      DROP INDEX IF EXISTS "public"."ship_sale_models_nom_idx";
      CREATE UNIQUE INDEX "ship_sale_models_nom_idx" ON "public"."ship_sale_models" USING btree ("nom");
    END $$;
  `)
}
