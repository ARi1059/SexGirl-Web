import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_appearance_theme" AS ENUM('default', 'ios');
  CREATE TABLE "appearance" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum_appearance_theme" DEFAULT 'default' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "appearance" CASCADE;
  DROP TYPE "public"."enum_appearance_theme";`)
}
