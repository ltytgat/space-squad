import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "characters_competences_speciales"
    ADD COLUMN "modificateur" numeric DEFAULT 0 NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "characters_competences_speciales"
    DROP COLUMN "modificateur";
  `)
}
