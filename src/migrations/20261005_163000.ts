import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "shop_transactions" (
      "id" serial PRIMARY KEY NOT NULL,
      "transaction_id" varchar NOT NULL,
      "fingerprint" varchar NOT NULL,
      "operation" varchar NOT NULL,
      "actor_id" integer NOT NULL,
      "character_id" integer NOT NULL,
      "ship_id" integer,
      "amount" numeric NOT NULL,
      "details" jsonb NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "shop_transactions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "shop_transactions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE RESTRICT,
      CONSTRAINT "shop_transactions_ship_id_ships_id_fk" FOREIGN KEY ("ship_id") REFERENCES "ships"("id") ON DELETE SET NULL
    );
    CREATE UNIQUE INDEX "shop_transactions_transaction_id_idx" ON "shop_transactions" USING btree ("transaction_id");
    CREATE INDEX "shop_transactions_actor_id_idx" ON "shop_transactions" USING btree ("actor_id");
    CREATE INDEX "shop_transactions_character_id_idx" ON "shop_transactions" USING btree ("character_id");
    CREATE INDEX "shop_transactions_ship_id_idx" ON "shop_transactions" USING btree ("ship_id");
    CREATE INDEX "shop_transactions_created_at_idx" ON "shop_transactions" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE "shop_transactions";`)
}
