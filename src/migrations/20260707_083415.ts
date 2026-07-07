import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters_rels" ADD COLUMN "weapons_id" integer;
  ALTER TABLE "characters_rels" ADD COLUMN "armors_id" integer;
  ALTER TABLE "characters_rels" ADD COLUMN "chips_id" integer;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_weapons_fk" FOREIGN KEY ("weapons_id") REFERENCES "public"."weapons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_armors_fk" FOREIGN KEY ("armors_id") REFERENCES "public"."armors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_chips_fk" FOREIGN KEY ("chips_id") REFERENCES "public"."chips"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "characters_rels_weapons_id_idx" ON "characters_rels" USING btree ("weapons_id");
  CREATE INDEX "characters_rels_armors_id_idx" ON "characters_rels" USING btree ("armors_id");
  CREATE INDEX "characters_rels_chips_id_idx" ON "characters_rels" USING btree ("chips_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters_rels" DROP CONSTRAINT "characters_rels_weapons_fk";
  
  ALTER TABLE "characters_rels" DROP CONSTRAINT "characters_rels_armors_fk";
  
  ALTER TABLE "characters_rels" DROP CONSTRAINT "characters_rels_chips_fk";
  
  DROP INDEX "characters_rels_weapons_id_idx";
  DROP INDEX "characters_rels_armors_id_idx";
  DROP INDEX "characters_rels_chips_id_idx";
  ALTER TABLE "characters_rels" DROP COLUMN "weapons_id";
  ALTER TABLE "characters_rels" DROP COLUMN "armors_id";
  ALTER TABLE "characters_rels" DROP COLUMN "chips_id";`)
}
