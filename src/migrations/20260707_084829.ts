import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "characters_inventaire_armes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_id" integer NOT NULL
  );
  
  CREATE TABLE "characters_inventaire_armures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_id" integer NOT NULL
  );
  
  ALTER TABLE "characters_rels" DROP CONSTRAINT "characters_rels_weapons_fk";
  
  ALTER TABLE "characters_rels" DROP CONSTRAINT "characters_rels_armors_fk";
  
  DROP INDEX "characters_rels_weapons_id_idx";
  DROP INDEX "characters_rels_armors_id_idx";
  ALTER TABLE "characters_inventaire_armes" ADD CONSTRAINT "characters_inventaire_armes_item_id_weapons_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters_inventaire_armes" ADD CONSTRAINT "characters_inventaire_armes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_inventaire_armures" ADD CONSTRAINT "characters_inventaire_armures_item_id_armors_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters_inventaire_armures" ADD CONSTRAINT "characters_inventaire_armures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "characters_inventaire_armes_order_idx" ON "characters_inventaire_armes" USING btree ("_order");
  CREATE INDEX "characters_inventaire_armes_parent_id_idx" ON "characters_inventaire_armes" USING btree ("_parent_id");
  CREATE INDEX "characters_inventaire_armes_item_idx" ON "characters_inventaire_armes" USING btree ("item_id");
  CREATE INDEX "characters_inventaire_armures_order_idx" ON "characters_inventaire_armures" USING btree ("_order");
  CREATE INDEX "characters_inventaire_armures_parent_id_idx" ON "characters_inventaire_armures" USING btree ("_parent_id");
  CREATE INDEX "characters_inventaire_armures_item_idx" ON "characters_inventaire_armures" USING btree ("item_id");
  ALTER TABLE "characters_rels" DROP COLUMN "weapons_id";
  ALTER TABLE "characters_rels" DROP COLUMN "armors_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters_inventaire_armes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "characters_inventaire_armures" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "characters_inventaire_armes" CASCADE;
  DROP TABLE "characters_inventaire_armures" CASCADE;
  ALTER TABLE "characters_rels" ADD COLUMN "weapons_id" integer;
  ALTER TABLE "characters_rels" ADD COLUMN "armors_id" integer;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_weapons_fk" FOREIGN KEY ("weapons_id") REFERENCES "public"."weapons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_armors_fk" FOREIGN KEY ("armors_id") REFERENCES "public"."armors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "characters_rels_weapons_id_idx" ON "characters_rels" USING btree ("weapons_id");
  CREATE INDEX "characters_rels_armors_id_idx" ON "characters_rels" USING btree ("armors_id");`)
}
