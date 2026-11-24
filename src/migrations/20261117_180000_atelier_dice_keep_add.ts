import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_atelier_modifications_effets_operation_next" AS ENUM('add', 'dice-count-add', 'dice-size-step', 'dice-keep-add', 'slot-add');
    ALTER TABLE "atelier_modifications_effets"
      ALTER COLUMN "operation" TYPE "public"."enum_atelier_modifications_effets_operation_next"
      USING "operation"::text::"public"."enum_atelier_modifications_effets_operation_next";
    DROP TYPE "public"."enum_atelier_modifications_effets_operation";
    ALTER TYPE "public"."enum_atelier_modifications_effets_operation_next"
      RENAME TO "enum_atelier_modifications_effets_operation";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $atelier_migration$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM "atelier_modifications_effets"
        WHERE "operation"::text IN ('dice-keep-add')
      ) THEN
        RAISE EXCEPTION 'Atelier dice-keep-add migration cannot be rolled back while effects use the new operation.';
      END IF;
    END;
    $atelier_migration$;

    CREATE TYPE "public"."enum_atelier_modifications_effets_operation_previous" AS ENUM('add', 'dice-count-add', 'dice-size-step', 'slot-add');
    ALTER TABLE "atelier_modifications_effets"
      ALTER COLUMN "operation" TYPE "public"."enum_atelier_modifications_effets_operation_previous"
      USING "operation"::text::"public"."enum_atelier_modifications_effets_operation_previous";
    DROP TYPE "public"."enum_atelier_modifications_effets_operation";
    ALTER TYPE "public"."enum_atelier_modifications_effets_operation_previous"
      RENAME TO "enum_atelier_modifications_effets_operation";
  `)
}
