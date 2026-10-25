import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "atelier_modifications_compatibilites"
      ADD COLUMN "prix" numeric NOT NULL,
      ADD COLUMN "maximum" numeric NOT NULL,
      ADD COLUMN "multiplicateur_rachat" numeric;

    ALTER TABLE "custom_equipment_modifications_atelier"
      ADD COLUMN "maximum" numeric,
      ADD COLUMN "multiplicateur_rachat" numeric,
      ADD COLUMN "compatibilite" jsonb;

    ALTER TABLE "atelier_modifications" DROP COLUMN "prix";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $atelier_compatibility_pricing_rollback$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM "atelier_modifications_compatibilites"
        GROUP BY "_parent_id"
        HAVING COUNT(DISTINCT "prix") > 1
          OR BOOL_OR("maximum" <> 1)
          OR BOOL_OR("multiplicateur_rachat" IS NOT NULL)
      ) OR EXISTS (
        SELECT 1
        FROM "custom_equipment_modifications_atelier"
        WHERE "maximum" IS NOT NULL
          OR "multiplicateur_rachat" IS NOT NULL
          OR "compatibilite" IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Atelier compatibility pricing cannot be rolled back without losing compatibility-specific values.';
      END IF;
    END;
    $atelier_compatibility_pricing_rollback$;

    ALTER TABLE "atelier_modifications" ADD COLUMN "prix" numeric;
    UPDATE "atelier_modifications" AS modification
    SET "prix" = (
      SELECT MIN(compatibility."prix")
      FROM "atelier_modifications_compatibilites" AS compatibility
      WHERE compatibility."_parent_id" = modification."id"
    );
    ALTER TABLE "atelier_modifications" ALTER COLUMN "prix" SET NOT NULL;

    ALTER TABLE "atelier_modifications_compatibilites"
      DROP COLUMN "prix",
      DROP COLUMN "maximum",
      DROP COLUMN "multiplicateur_rachat";

    ALTER TABLE "custom_equipment_modifications_atelier"
      DROP COLUMN "maximum",
      DROP COLUMN "multiplicateur_rachat",
      DROP COLUMN "compatibilite";
  `)
}
