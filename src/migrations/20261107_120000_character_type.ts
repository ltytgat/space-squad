import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_characters_type_personnage" AS ENUM ('joueur', 'pnj');
    ALTER TABLE "characters" ADD COLUMN "type_personnage" "enum_characters_type_personnage" DEFAULT 'joueur' NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "characters" DROP COLUMN "type_personnage";
    DROP TYPE "public"."enum_characters_type_personnage";
  `)
}
