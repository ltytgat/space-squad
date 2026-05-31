import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "weapons_paliers_sniper" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"distance_max" numeric,
  	"modificateur" numeric
  );
  
  DROP TABLE "weapons_intervalles_portee" CASCADE;
  ALTER TABLE "weapons" ADD COLUMN "courte_portee" numeric;
  ALTER TABLE "weapons" ADD COLUMN "mod_courte_portee" numeric;
  ALTER TABLE "weapons" ADD COLUMN "moyenne_portee" numeric;
  ALTER TABLE "weapons" ADD COLUMN "mod_moyenne_portee" numeric;
  ALTER TABLE "weapons_paliers_sniper" ADD CONSTRAINT "weapons_paliers_sniper_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."weapons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "weapons_paliers_sniper_order_idx" ON "weapons_paliers_sniper" USING btree ("_order");
  CREATE INDEX "weapons_paliers_sniper_parent_id_idx" ON "weapons_paliers_sniper" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "weapons_intervalles_portee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"distance_max" numeric,
  	"modificateur" numeric
  );
  
  DROP TABLE "weapons_paliers_sniper" CASCADE;
  ALTER TABLE "weapons_intervalles_portee" ADD CONSTRAINT "weapons_intervalles_portee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."weapons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "weapons_intervalles_portee_order_idx" ON "weapons_intervalles_portee" USING btree ("_order");
  CREATE INDEX "weapons_intervalles_portee_parent_id_idx" ON "weapons_intervalles_portee" USING btree ("_parent_id");
  ALTER TABLE "weapons" DROP COLUMN "courte_portee";
  ALTER TABLE "weapons" DROP COLUMN "mod_courte_portee";
  ALTER TABLE "weapons" DROP COLUMN "moyenne_portee";
  ALTER TABLE "weapons" DROP COLUMN "mod_moyenne_portee";`)
}
