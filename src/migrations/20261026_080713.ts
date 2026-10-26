import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $atelier_canon_enum$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_enum AS enum_value
        JOIN pg_type AS enum_type ON enum_type.oid = enum_value.enumtypid
        JOIN pg_namespace AS enum_schema ON enum_schema.oid = enum_type.typnamespace
        WHERE enum_schema.nspname = 'public'
          AND enum_type.typname = 'enum_atelier_modifications_compatibilites_sous_categorie'
          AND enum_value.enumlabel = 'canon'
      ) THEN
        ALTER TYPE "public"."enum_atelier_modifications_compatibilites_sous_categorie"
          ADD VALUE 'canon' BEFORE 'sniper';
      END IF;
    END;
    $atelier_canon_enum$;

    ALTER TABLE "atelier_modifications_compatibilites"
      ADD COLUMN IF NOT EXISTS "points" numeric;
    UPDATE "atelier_modifications_compatibilites"
      SET "points" = 0
      WHERE "points" IS NULL;
    ALTER TABLE "atelier_modifications_compatibilites"
      ALTER COLUMN "points" SET NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $atelier_canon_rollback$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM "atelier_modifications_compatibilites"
        WHERE "sous_categorie"::text = 'canon'
      ) THEN
        RAISE EXCEPTION 'Cannot remove the canon subcategory while Atelier compatibility rows use it.';
      END IF;
    END;
    $atelier_canon_rollback$;

    ALTER TABLE "atelier_modifications_compatibilites"
      ALTER COLUMN "sous_categorie" SET DATA TYPE text;
    DROP TYPE "public"."enum_atelier_modifications_compatibilites_sous_categorie";
    CREATE TYPE "public"."enum_atelier_modifications_compatibilites_sous_categorie" AS ENUM('fusil-assaut', 'shotgun', 'sniper', 'pistolet', 'tete', 'torse', 'bras', 'jambes');
    ALTER TABLE "atelier_modifications_compatibilites"
      ALTER COLUMN "sous_categorie" SET DATA TYPE "public"."enum_atelier_modifications_compatibilites_sous_categorie"
      USING "sous_categorie"::"public"."enum_atelier_modifications_compatibilites_sous_categorie";
    ALTER TABLE "atelier_modifications_compatibilites" DROP COLUMN "points";
  `)
}
