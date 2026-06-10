import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mods_modificateurs_cible" AS ENUM('stat_force', 'stat_habilite', 'stat_connaissances', 'stat_culture', 'stat_anticipation', 'stat_perception', 'armure_physique', 'armure_bouclier', 'armure_rupture', 'degats_flat', 'degats_mod_fo_x1', 'degats_mod_pe_x1', 'portee_courte', 'portee_moyenne', 'mod_portee_courte', 'mod_portee_moyenne', 'chargeur', 'poids', 'indicator_surcharge', 'indicator_projectiles', 'indicator_acide', 'indicator_tazer', 'indicator_gravite_faible', 'indicator_gravite_forte', 'indicator_lumiere', 'indicator_double_pistolet');
  CREATE TABLE "mods_modificateurs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cible" "enum_mods_modificateurs_cible" NOT NULL,
  	"valeur" numeric NOT NULL
  );
  
  ALTER TABLE "characters" ADD COLUMN "bonus_points_de_blessures" numeric DEFAULT 0;
  ALTER TABLE "mods_modificateurs" ADD CONSTRAINT "mods_modificateurs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mods"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mods_modificateurs_order_idx" ON "mods_modificateurs" USING btree ("_order");
  CREATE INDEX "mods_modificateurs_parent_id_idx" ON "mods_modificateurs" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mods_modificateurs" CASCADE;
  ALTER TABLE "characters" DROP COLUMN "bonus_points_de_blessures";
  DROP TYPE "public"."enum_mods_modificateurs_cible";`)
}
