import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_characters_inventaire_recompenses_faction_type_recompense" ADD VALUE 'acces-atelier' BEFORE 'bon-reduction';
  ALTER TYPE "public"."enum_faction_reward_tiers_type_recompense" ADD VALUE 'acces-atelier' BEFORE 'bon-reduction';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $atelier_access_rollback$
   BEGIN
     IF EXISTS (
       SELECT 1 FROM "characters_inventaire_recompenses_faction"
       WHERE "type_recompense"::text = 'acces-atelier'
     ) OR EXISTS (
       SELECT 1 FROM "faction_reward_tiers"
       WHERE "type_recompense"::text = 'acces-atelier'
     ) THEN
       RAISE EXCEPTION 'Cannot remove Accès Atelier while a character or reward tier uses it.';
     END IF;
   END;
   $atelier_access_rollback$;
   ALTER TABLE "characters_inventaire_recompenses_faction" ALTER COLUMN "type_recompense" SET DATA TYPE text;
  DROP TYPE "public"."enum_characters_inventaire_recompenses_faction_type_recompense";
  CREATE TYPE "public"."enum_characters_inventaire_recompenses_faction_type_recompense" AS ENUM('acces-armes-ex', 'bon-reduction');
  ALTER TABLE "characters_inventaire_recompenses_faction" ALTER COLUMN "type_recompense" SET DATA TYPE "public"."enum_characters_inventaire_recompenses_faction_type_recompense" USING "type_recompense"::"public"."enum_characters_inventaire_recompenses_faction_type_recompense";
  ALTER TABLE "faction_reward_tiers" ALTER COLUMN "type_recompense" SET DATA TYPE text;
  ALTER TABLE "faction_reward_tiers" ALTER COLUMN "type_recompense" SET DEFAULT 'bon-reduction'::text;
  DROP TYPE "public"."enum_faction_reward_tiers_type_recompense";
  CREATE TYPE "public"."enum_faction_reward_tiers_type_recompense" AS ENUM('acces-armes-ex', 'bon-reduction');
  ALTER TABLE "faction_reward_tiers" ALTER COLUMN "type_recompense" SET DEFAULT 'bon-reduction'::"public"."enum_faction_reward_tiers_type_recompense";
  ALTER TABLE "faction_reward_tiers" ALTER COLUMN "type_recompense" SET DATA TYPE "public"."enum_faction_reward_tiers_type_recompense" USING "type_recompense"::"public"."enum_faction_reward_tiers_type_recompense";`)
}
