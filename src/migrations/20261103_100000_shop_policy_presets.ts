import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "shop_policy_presets" (
      "id" serial PRIMARY KEY NOT NULL,
      "owner_id" integer NOT NULL,
      "name" varchar NOT NULL,
      "name_key" varchar NOT NULL,
      "policy" jsonb NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "shop_policy_presets" ADD CONSTRAINT "shop_policy_presets_owner_id_users_id_fk"
      FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "shop_policy_presets_owner_idx" ON "shop_policy_presets" USING btree ("owner_id");
    CREATE UNIQUE INDEX "owner_name_key_idx" ON "shop_policy_presets" USING btree ("owner_id", "name_key");
    CREATE INDEX "shop_policy_presets_updated_at_idx" ON "shop_policy_presets" USING btree ("updated_at");
    CREATE INDEX "shop_policy_presets_created_at_idx" ON "shop_policy_presets" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "shop_policy_presets_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shop_policy_presets_fk"
      FOREIGN KEY ("shop_policy_presets_id") REFERENCES "public"."shop_policy_presets"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_shop_policy_presets_id_idx"
      ON "payload_locked_documents_rels" USING btree ("shop_policy_presets_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_shop_policy_presets_fk";
    DROP INDEX "payload_locked_documents_rels_shop_policy_presets_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "shop_policy_presets_id";
    DROP TABLE "shop_policy_presets" CASCADE;
  `)
}
