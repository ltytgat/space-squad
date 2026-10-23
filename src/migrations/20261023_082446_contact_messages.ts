import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_contact_messages_kind" AS ENUM('guest', 'user');
  CREATE TYPE "public"."enum_contact_messages_status" AS ENUM('nouveau', 'traite');
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_contact_messages_kind" NOT NULL,
  	"status" "enum_contact_messages_status" DEFAULT 'nouveau' NOT NULL,
  	"email_sent" boolean DEFAULT false,
  	"email" varchar NOT NULL,
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"user_id" integer,
  	"character_id" integer,
  	"ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contact_messages_id" integer;
  ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "contact_messages_user_idx" ON "contact_messages" USING btree ("user_id");
  CREATE INDEX "contact_messages_character_idx" ON "contact_messages" USING btree ("character_id");
  CREATE INDEX "contact_messages_ip_hash_idx" ON "contact_messages" USING btree ("ip_hash");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contact_messages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contact_messages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contact_messages_fk";
  
  DROP INDEX "payload_locked_documents_rels_contact_messages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contact_messages_id";
  DROP TYPE "public"."enum_contact_messages_kind";
  DROP TYPE "public"."enum_contact_messages_status";`)
}
