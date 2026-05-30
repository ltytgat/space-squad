import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "weapons_intervalles_portee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"distance_max" numeric,
  	"modificateur" numeric
  );
  
  ALTER TABLE "weapons" RENAME COLUMN "portee" TO "portee_fixe";
  ALTER TABLE "weapons" ADD COLUMN "tranche_malus_longue_portee" numeric;
  ALTER TABLE "weapons" ADD COLUMN "malus_par_tranche" numeric DEFAULT -1;
  ALTER TABLE "weapons_intervalles_portee" ADD CONSTRAINT "weapons_intervalles_portee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."weapons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "weapons_intervalles_portee_order_idx" ON "weapons_intervalles_portee" USING btree ("_order");
  CREATE INDEX "weapons_intervalles_portee_parent_id_idx" ON "weapons_intervalles_portee" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "weapons_intervalles_portee" CASCADE;
  ALTER TABLE "weapons" ADD COLUMN "portee" numeric;
  ALTER TABLE "weapons" DROP COLUMN "portee_fixe";
  ALTER TABLE "weapons" DROP COLUMN "tranche_malus_longue_portee";
  ALTER TABLE "weapons" DROP COLUMN "malus_par_tranche";`)
}
