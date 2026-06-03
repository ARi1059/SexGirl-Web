import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_app_download_guide_blocks_download_platform" AS ENUM('android', 'ios', 'other');
  CREATE TYPE "public"."enum_find_us_guide_blocks_download_platform" AS ENUM('android', 'ios', 'other');
  CREATE TABLE "downloads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "app_download_guide_blocks_download" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer NOT NULL,
  	"label" varchar NOT NULL,
  	"platform" "enum_app_download_guide_blocks_download_platform" DEFAULT 'other',
  	"version" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "find_us_guide_blocks_download" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer NOT NULL,
  	"label" varchar NOT NULL,
  	"platform" "enum_find_us_guide_blocks_download_platform" DEFAULT 'other',
  	"version" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "downloads_id" integer;
  ALTER TABLE "app_download_guide_blocks_download" ADD CONSTRAINT "app_download_guide_blocks_download_file_id_downloads_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."downloads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_download_guide_blocks_download" ADD CONSTRAINT "app_download_guide_blocks_download_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_download_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_download" ADD CONSTRAINT "find_us_guide_blocks_download_file_id_downloads_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."downloads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_download" ADD CONSTRAINT "find_us_guide_blocks_download_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."find_us_guide"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "downloads_updated_at_idx" ON "downloads" USING btree ("updated_at");
  CREATE INDEX "downloads_created_at_idx" ON "downloads" USING btree ("created_at");
  CREATE UNIQUE INDEX "downloads_filename_idx" ON "downloads" USING btree ("filename");
  CREATE INDEX "app_download_guide_blocks_download_order_idx" ON "app_download_guide_blocks_download" USING btree ("_order");
  CREATE INDEX "app_download_guide_blocks_download_parent_id_idx" ON "app_download_guide_blocks_download" USING btree ("_parent_id");
  CREATE INDEX "app_download_guide_blocks_download_path_idx" ON "app_download_guide_blocks_download" USING btree ("_path");
  CREATE INDEX "app_download_guide_blocks_download_file_idx" ON "app_download_guide_blocks_download" USING btree ("file_id");
  CREATE INDEX "find_us_guide_blocks_download_order_idx" ON "find_us_guide_blocks_download" USING btree ("_order");
  CREATE INDEX "find_us_guide_blocks_download_parent_id_idx" ON "find_us_guide_blocks_download" USING btree ("_parent_id");
  CREATE INDEX "find_us_guide_blocks_download_path_idx" ON "find_us_guide_blocks_download" USING btree ("_path");
  CREATE INDEX "find_us_guide_blocks_download_file_idx" ON "find_us_guide_blocks_download" USING btree ("file_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "public"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_downloads_id_idx" ON "payload_locked_documents_rels" USING btree ("downloads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "downloads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "app_download_guide_blocks_download" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "find_us_guide_blocks_download" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "downloads" CASCADE;
  DROP TABLE "app_download_guide_blocks_download" CASCADE;
  DROP TABLE "find_us_guide_blocks_download" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_downloads_fk";
  
  DROP INDEX "payload_locked_documents_rels_downloads_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "downloads_id";
  DROP TYPE "public"."enum_app_download_guide_blocks_download_platform";
  DROP TYPE "public"."enum_find_us_guide_blocks_download_platform";`)
}
