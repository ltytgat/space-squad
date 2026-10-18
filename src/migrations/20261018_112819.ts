import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_consumables_type_munition" ADD VALUE 'balles-lourdes' BEFORE 'cartouche';
  CREATE TABLE "character_workspaces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token_hash" varchar NOT NULL,
  	"created_from_hash" varchar,
  	"last_activity_at" timestamp(3) with time zone NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"request_window_started_at" timestamp(3) with time zone NOT NULL,
  	"request_count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "characters" ALTER COLUMN "user_id" DROP NOT NULL;
  ALTER TABLE "weapons" ADD COLUMN "force_minimum" numeric;
  ALTER TABLE "characters" ADD COLUMN "workspace_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "character_workspaces_id" integer;
  CREATE UNIQUE INDEX "character_workspaces_token_hash_idx" ON "character_workspaces" USING btree ("token_hash");
  CREATE INDEX "character_workspaces_created_from_hash_idx" ON "character_workspaces" USING btree ("created_from_hash");
  CREATE INDEX "character_workspaces_last_activity_at_idx" ON "character_workspaces" USING btree ("last_activity_at");
  CREATE INDEX "character_workspaces_expires_at_idx" ON "character_workspaces" USING btree ("expires_at");
  CREATE INDEX "character_workspaces_updated_at_idx" ON "character_workspaces" USING btree ("updated_at");
  CREATE INDEX "character_workspaces_created_at_idx" ON "character_workspaces" USING btree ("created_at");
  ALTER TABLE "characters" ADD CONSTRAINT "characters_workspace_id_character_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."character_workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_character_workspaces_fk" FOREIGN KEY ("character_workspaces_id") REFERENCES "public"."character_workspaces"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "characters_workspace_idx" ON "characters" USING btree ("workspace_id");
  CREATE INDEX "payload_locked_documents_rels_character_workspaces_id_idx" ON "payload_locked_documents_rels" USING btree ("character_workspaces_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "character_workspaces" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "character_workspaces" CASCADE;
  ALTER TABLE "characters" DROP CONSTRAINT "characters_workspace_id_character_workspaces_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_character_workspaces_fk";
  
  ALTER TABLE "consumables" ALTER COLUMN "type_munition" SET DATA TYPE text;
  DROP TYPE "public"."enum_consumables_type_munition";
  CREATE TYPE "public"."enum_consumables_type_munition" AS ENUM('chargeur', 'cartouche', 'conteneur');
  ALTER TABLE "consumables" ALTER COLUMN "type_munition" SET DATA TYPE "public"."enum_consumables_type_munition" USING "type_munition"::"public"."enum_consumables_type_munition";
  DROP INDEX "characters_workspace_idx";
  DROP INDEX "payload_locked_documents_rels_character_workspaces_id_idx";
  ALTER TABLE "characters" ALTER COLUMN "user_id" SET NOT NULL;
  ALTER TABLE "weapons" DROP COLUMN "force_minimum";
  ALTER TABLE "characters" DROP COLUMN "workspace_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "character_workspaces_id";`)
}
