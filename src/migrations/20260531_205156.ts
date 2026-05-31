import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "characters_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"mods_id" integer
  );
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_armure_tete_id_armors_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_armure_torse_id_armors_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_armure_bras_id_armors_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_armure_jambes_id_armors_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_principale_id_weapons_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_secondaire_id_weapons_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_lourde_id_weapons_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_de_poing_id_weapons_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_de_melee_id_weapons_id_fk";
  
  DROP INDEX "characters_armure_tete_idx";
  DROP INDEX "characters_armure_torse_idx";
  DROP INDEX "characters_armure_bras_idx";
  DROP INDEX "characters_armure_jambes_idx";
  DROP INDEX "characters_arme_principale_idx";
  DROP INDEX "characters_arme_secondaire_idx";
  DROP INDEX "characters_arme_lourde_idx";
  DROP INDEX "characters_arme_de_poing_idx";
  DROP INDEX "characters_arme_de_melee_idx";
  ALTER TABLE "weapons" ADD COLUMN "image_id" integer;
  ALTER TABLE "armors" ADD COLUMN "image_id" integer;
  ALTER TABLE "armor_sets" ADD COLUMN "image_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_tete_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_torse_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_bras_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_jambes_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_principale_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_secondaire_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_lourde_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_de_poing_item_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_de_melee_item_id" integer;
  ALTER TABLE "mods" ADD COLUMN "image_id" integer;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "characters_rels" ADD CONSTRAINT "characters_rels_mods_fk" FOREIGN KEY ("mods_id") REFERENCES "public"."mods"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "characters_rels_order_idx" ON "characters_rels" USING btree ("order");
  CREATE INDEX "characters_rels_parent_idx" ON "characters_rels" USING btree ("parent_id");
  CREATE INDEX "characters_rels_path_idx" ON "characters_rels" USING btree ("path");
  CREATE INDEX "characters_rels_mods_id_idx" ON "characters_rels" USING btree ("mods_id");
  ALTER TABLE "weapons" ADD CONSTRAINT "weapons_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "armors" ADD CONSTRAINT "armors_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "armor_sets" ADD CONSTRAINT "armor_sets_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_tete_item_id_armors_id_fk" FOREIGN KEY ("armure_tete_item_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_torse_item_id_armors_id_fk" FOREIGN KEY ("armure_torse_item_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_bras_item_id_armors_id_fk" FOREIGN KEY ("armure_bras_item_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_jambes_item_id_armors_id_fk" FOREIGN KEY ("armure_jambes_item_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_principale_item_id_weapons_id_fk" FOREIGN KEY ("arme_principale_item_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_secondaire_item_id_weapons_id_fk" FOREIGN KEY ("arme_secondaire_item_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_lourde_item_id_weapons_id_fk" FOREIGN KEY ("arme_lourde_item_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_de_poing_item_id_weapons_id_fk" FOREIGN KEY ("arme_de_poing_item_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_de_melee_item_id_weapons_id_fk" FOREIGN KEY ("arme_de_melee_item_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mods" ADD CONSTRAINT "mods_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "weapons_image_idx" ON "weapons" USING btree ("image_id");
  CREATE INDEX "armors_image_idx" ON "armors" USING btree ("image_id");
  CREATE INDEX "armor_sets_image_idx" ON "armor_sets" USING btree ("image_id");
  CREATE INDEX "characters_armure_tete_armure_tete_item_idx" ON "characters" USING btree ("armure_tete_item_id");
  CREATE INDEX "characters_armure_torse_armure_torse_item_idx" ON "characters" USING btree ("armure_torse_item_id");
  CREATE INDEX "characters_armure_bras_armure_bras_item_idx" ON "characters" USING btree ("armure_bras_item_id");
  CREATE INDEX "characters_armure_jambes_armure_jambes_item_idx" ON "characters" USING btree ("armure_jambes_item_id");
  CREATE INDEX "characters_arme_principale_arme_principale_item_idx" ON "characters" USING btree ("arme_principale_item_id");
  CREATE INDEX "characters_arme_secondaire_arme_secondaire_item_idx" ON "characters" USING btree ("arme_secondaire_item_id");
  CREATE INDEX "characters_arme_lourde_arme_lourde_item_idx" ON "characters" USING btree ("arme_lourde_item_id");
  CREATE INDEX "characters_arme_de_poing_arme_de_poing_item_idx" ON "characters" USING btree ("arme_de_poing_item_id");
  CREATE INDEX "characters_arme_de_melee_arme_de_melee_item_idx" ON "characters" USING btree ("arme_de_melee_item_id");
  CREATE INDEX "mods_image_idx" ON "mods" USING btree ("image_id");
  ALTER TABLE "characters" DROP COLUMN "armure_tete_id";
  ALTER TABLE "characters" DROP COLUMN "armure_torse_id";
  ALTER TABLE "characters" DROP COLUMN "armure_bras_id";
  ALTER TABLE "characters" DROP COLUMN "armure_jambes_id";
  ALTER TABLE "characters" DROP COLUMN "arme_principale_id";
  ALTER TABLE "characters" DROP COLUMN "arme_secondaire_id";
  ALTER TABLE "characters" DROP COLUMN "arme_lourde_id";
  ALTER TABLE "characters" DROP COLUMN "arme_de_poing_id";
  ALTER TABLE "characters" DROP COLUMN "arme_de_melee_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "characters_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "characters_rels" CASCADE;
  ALTER TABLE "weapons" DROP CONSTRAINT "weapons_image_id_media_id_fk";
  
  ALTER TABLE "armors" DROP CONSTRAINT "armors_image_id_media_id_fk";
  
  ALTER TABLE "armor_sets" DROP CONSTRAINT "armor_sets_image_id_media_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_armure_tete_item_id_armors_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_armure_torse_item_id_armors_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_armure_bras_item_id_armors_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_armure_jambes_item_id_armors_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_principale_item_id_weapons_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_secondaire_item_id_weapons_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_lourde_item_id_weapons_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_de_poing_item_id_weapons_id_fk";
  
  ALTER TABLE "characters" DROP CONSTRAINT "characters_arme_de_melee_item_id_weapons_id_fk";
  
  ALTER TABLE "mods" DROP CONSTRAINT "mods_image_id_media_id_fk";
  
  DROP INDEX "weapons_image_idx";
  DROP INDEX "armors_image_idx";
  DROP INDEX "armor_sets_image_idx";
  DROP INDEX "characters_armure_tete_armure_tete_item_idx";
  DROP INDEX "characters_armure_torse_armure_torse_item_idx";
  DROP INDEX "characters_armure_bras_armure_bras_item_idx";
  DROP INDEX "characters_armure_jambes_armure_jambes_item_idx";
  DROP INDEX "characters_arme_principale_arme_principale_item_idx";
  DROP INDEX "characters_arme_secondaire_arme_secondaire_item_idx";
  DROP INDEX "characters_arme_lourde_arme_lourde_item_idx";
  DROP INDEX "characters_arme_de_poing_arme_de_poing_item_idx";
  DROP INDEX "characters_arme_de_melee_arme_de_melee_item_idx";
  DROP INDEX "mods_image_idx";
  ALTER TABLE "characters" ADD COLUMN "armure_tete_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_torse_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_bras_id" integer;
  ALTER TABLE "characters" ADD COLUMN "armure_jambes_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_principale_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_secondaire_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_lourde_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_de_poing_id" integer;
  ALTER TABLE "characters" ADD COLUMN "arme_de_melee_id" integer;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_tete_id_armors_id_fk" FOREIGN KEY ("armure_tete_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_torse_id_armors_id_fk" FOREIGN KEY ("armure_torse_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_bras_id_armors_id_fk" FOREIGN KEY ("armure_bras_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_armure_jambes_id_armors_id_fk" FOREIGN KEY ("armure_jambes_id") REFERENCES "public"."armors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_principale_id_weapons_id_fk" FOREIGN KEY ("arme_principale_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_secondaire_id_weapons_id_fk" FOREIGN KEY ("arme_secondaire_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_lourde_id_weapons_id_fk" FOREIGN KEY ("arme_lourde_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_de_poing_id_weapons_id_fk" FOREIGN KEY ("arme_de_poing_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_arme_de_melee_id_weapons_id_fk" FOREIGN KEY ("arme_de_melee_id") REFERENCES "public"."weapons"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "characters_armure_tete_idx" ON "characters" USING btree ("armure_tete_id");
  CREATE INDEX "characters_armure_torse_idx" ON "characters" USING btree ("armure_torse_id");
  CREATE INDEX "characters_armure_bras_idx" ON "characters" USING btree ("armure_bras_id");
  CREATE INDEX "characters_armure_jambes_idx" ON "characters" USING btree ("armure_jambes_id");
  CREATE INDEX "characters_arme_principale_idx" ON "characters" USING btree ("arme_principale_id");
  CREATE INDEX "characters_arme_secondaire_idx" ON "characters" USING btree ("arme_secondaire_id");
  CREATE INDEX "characters_arme_lourde_idx" ON "characters" USING btree ("arme_lourde_id");
  CREATE INDEX "characters_arme_de_poing_idx" ON "characters" USING btree ("arme_de_poing_id");
  CREATE INDEX "characters_arme_de_melee_idx" ON "characters" USING btree ("arme_de_melee_id");
  ALTER TABLE "weapons" DROP COLUMN "image_id";
  ALTER TABLE "armors" DROP COLUMN "image_id";
  ALTER TABLE "armor_sets" DROP COLUMN "image_id";
  ALTER TABLE "characters" DROP COLUMN "armure_tete_item_id";
  ALTER TABLE "characters" DROP COLUMN "armure_torse_item_id";
  ALTER TABLE "characters" DROP COLUMN "armure_bras_item_id";
  ALTER TABLE "characters" DROP COLUMN "armure_jambes_item_id";
  ALTER TABLE "characters" DROP COLUMN "arme_principale_item_id";
  ALTER TABLE "characters" DROP COLUMN "arme_secondaire_item_id";
  ALTER TABLE "characters" DROP COLUMN "arme_lourde_item_id";
  ALTER TABLE "characters" DROP COLUMN "arme_de_poing_item_id";
  ALTER TABLE "characters" DROP COLUMN "arme_de_melee_item_id";
  ALTER TABLE "mods" DROP COLUMN "image_id";`)
}
