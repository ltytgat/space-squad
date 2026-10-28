import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_characters_competences_speciales_caracteristique" AS ENUM('force', 'habilite', 'connaissances', 'culture', 'anticipation', 'perception');
  CREATE TYPE "public"."enum_characters_competences_speciales_categorie_epreuve" AS ENUM('vaisseau', 'pacifiques', 'combat');
  ALTER TABLE "characters_competences_speciales" ADD COLUMN "caracteristique" "enum_characters_competences_speciales_caracteristique";
  ALTER TABLE "characters_competences_speciales" ADD COLUMN "categorie_epreuve" "enum_characters_competences_speciales_categorie_epreuve";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters_competences_speciales" DROP COLUMN "caracteristique";
  ALTER TABLE "characters_competences_speciales" DROP COLUMN "categorie_epreuve";
  DROP TYPE "public"."enum_characters_competences_speciales_caracteristique";
  DROP TYPE "public"."enum_characters_competences_speciales_categorie_epreuve";`)
}
