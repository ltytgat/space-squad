import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_de_poing_item_id_weapons_id_fk";
  
  DROP INDEX "characters_arme_de_poing_arme_de_poing_item_idx";
  ALTER TABLE "characters" ADD COLUMN "consommable_equipe1_id" integer;
  ALTER TABLE "characters" ADD COLUMN "consommable_equipe2_id" integer;
  ALTER TABLE "characters" ADD COLUMN "consommable_equipe3_id" integer;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_consommable_equipe1_id_consumables_id_fk" FOREIGN KEY ("consommable_equipe1_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_consommable_equipe2_id_consumables_id_fk" FOREIGN KEY ("consommable_equipe2_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_consommable_equipe3_id_consumables_id_fk" FOREIGN KEY ("consommable_equipe3_id") REFERENCES "public"."consumables"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "characters_consommable_equipe1_idx" ON "characters" USING btree ("consommable_equipe1_id");
  CREATE INDEX "characters_consommable_equipe2_idx" ON "characters" USING btree ("consommable_equipe2_id");
  CREATE INDEX "characters_consommable_equipe3_idx" ON "characters" USING btree ("consommable_equipe3_id");
  ALTER TABLE "characters" DROP COLUMN "arme_de_poing_item_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters" DROP CONSTRAINT "characters_consommable_equipe1_id_consumables_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_consommable_equipe2_id_consumables_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_consommable_equipe3_id_consumables_id_fk";
  
  DROP INDEX "characters_consommable_equipe1_idx";
  DROP INDEX "characters_consommable_equipe2_idx";
  DROP INDEX "characters_consommable_equipe3_idx";
  ALTER TABLE "characters" ADD COLUMN "arme_de_poing_item_id" integer;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_de_poing_item_id_weapons_id_fk" FOREIGN KEY ("arme_de_poing_item_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "characters_arme_de_poing_arme_de_poing_item_idx" ON "characters" USING btree ("arme_de_poing_item_id");
  ALTER TABLE "characters" DROP COLUMN "consommable_equipe1_id";
  ALTER TABLE "characters" DROP COLUMN "consommable_equipe2_id";
  ALTER TABLE "characters" DROP COLUMN "consommable_equipe3_id";`)
}
