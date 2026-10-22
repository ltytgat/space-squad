import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN "is_mj" boolean DEFAULT false NOT NULL;
    ALTER TABLE "groups" ADD COLUMN "creator_id" integer;
    ALTER TABLE "groups" ADD COLUMN "invite_code" varchar;
    ALTER TABLE "groups" ADD CONSTRAINT "groups_creator_id_users_id_fk"
      FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "groups_creator_idx" ON "groups" USING btree ("creator_id");
    CREATE UNIQUE INDEX "groups_invite_code_idx" ON "groups" USING btree ("invite_code");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "groups_invite_code_idx";
    DROP INDEX "groups_creator_idx";
    ALTER TABLE "groups" DROP CONSTRAINT "groups_creator_id_users_id_fk";
    ALTER TABLE "groups" DROP COLUMN "invite_code";
    ALTER TABLE "groups" DROP COLUMN "creator_id";
    ALTER TABLE "users" DROP COLUMN "is_mj";
  `)
}
