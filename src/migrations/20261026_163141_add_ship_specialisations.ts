import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ship_models_specialisations" AS ENUM('combat', 'exploration', 'transport');
  CREATE TABLE "ship_models_specialisations" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_ship_models_specialisations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "ship_models_specialisations" ADD CONSTRAINT "ship_models_specialisations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ship_models"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ship_models_specialisations_order_idx" ON "ship_models_specialisations" USING btree ("order");
  CREATE INDEX "ship_models_specialisations_parent_idx" ON "ship_models_specialisations" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "ship_models_specialisations" CASCADE;
  DROP TYPE "public"."enum_ship_models_specialisations";`)
}
