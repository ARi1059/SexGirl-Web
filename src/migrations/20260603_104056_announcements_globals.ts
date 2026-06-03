import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_app_download_guide_blocks_button_style" AS ENUM('primary', 'secondary', 'outline');
  CREATE TYPE "public"."enum_app_download_guide_blocks_callout_tone" AS ENUM('info', 'warning', 'success');
  CREATE TYPE "public"."enum_find_us_guide_blocks_button_style" AS ENUM('primary', 'secondary', 'outline');
  CREATE TYPE "public"."enum_find_us_guide_blocks_callout_tone" AS ENUM('info', 'warning', 'success');
  CREATE TABLE "app_download_guide_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "app_download_guide_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "app_download_guide_blocks_button" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"style" "enum_app_download_guide_blocks_button_style" DEFAULT 'primary',
  	"icon" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "app_download_guide_blocks_step" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" jsonb,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "app_download_guide_blocks_qrcode" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"label" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "app_download_guide_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tone" "enum_app_download_guide_blocks_callout_tone" DEFAULT 'info',
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "app_download_guide" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'App 下载教学',
  	"intro" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "find_us_guide_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "find_us_guide_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "find_us_guide_blocks_button" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"style" "enum_find_us_guide_blocks_button_style" DEFAULT 'primary',
  	"icon" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "find_us_guide_blocks_step" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" jsonb,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "find_us_guide_blocks_qrcode" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"label" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "find_us_guide_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tone" "enum_find_us_guide_blocks_callout_tone" DEFAULT 'info',
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "find_us_guide" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT '如何永久找到我们',
  	"intro" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "app_download_guide_blocks_rich_text" ADD CONSTRAINT "app_download_guide_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_download_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_download_guide_blocks_image" ADD CONSTRAINT "app_download_guide_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_download_guide_blocks_image" ADD CONSTRAINT "app_download_guide_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_download_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_download_guide_blocks_button" ADD CONSTRAINT "app_download_guide_blocks_button_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_download_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_download_guide_blocks_step" ADD CONSTRAINT "app_download_guide_blocks_step_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_download_guide_blocks_step" ADD CONSTRAINT "app_download_guide_blocks_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_download_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_download_guide_blocks_qrcode" ADD CONSTRAINT "app_download_guide_blocks_qrcode_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "app_download_guide_blocks_qrcode" ADD CONSTRAINT "app_download_guide_blocks_qrcode_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_download_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_download_guide_blocks_callout" ADD CONSTRAINT "app_download_guide_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."app_download_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_rich_text" ADD CONSTRAINT "find_us_guide_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."find_us_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_image" ADD CONSTRAINT "find_us_guide_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_image" ADD CONSTRAINT "find_us_guide_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."find_us_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_button" ADD CONSTRAINT "find_us_guide_blocks_button_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."find_us_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_step" ADD CONSTRAINT "find_us_guide_blocks_step_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_step" ADD CONSTRAINT "find_us_guide_blocks_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."find_us_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_qrcode" ADD CONSTRAINT "find_us_guide_blocks_qrcode_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_qrcode" ADD CONSTRAINT "find_us_guide_blocks_qrcode_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."find_us_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "find_us_guide_blocks_callout" ADD CONSTRAINT "find_us_guide_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."find_us_guide"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "app_download_guide_blocks_rich_text_order_idx" ON "app_download_guide_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "app_download_guide_blocks_rich_text_parent_id_idx" ON "app_download_guide_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "app_download_guide_blocks_rich_text_path_idx" ON "app_download_guide_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "app_download_guide_blocks_image_order_idx" ON "app_download_guide_blocks_image" USING btree ("_order");
  CREATE INDEX "app_download_guide_blocks_image_parent_id_idx" ON "app_download_guide_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "app_download_guide_blocks_image_path_idx" ON "app_download_guide_blocks_image" USING btree ("_path");
  CREATE INDEX "app_download_guide_blocks_image_image_idx" ON "app_download_guide_blocks_image" USING btree ("image_id");
  CREATE INDEX "app_download_guide_blocks_button_order_idx" ON "app_download_guide_blocks_button" USING btree ("_order");
  CREATE INDEX "app_download_guide_blocks_button_parent_id_idx" ON "app_download_guide_blocks_button" USING btree ("_parent_id");
  CREATE INDEX "app_download_guide_blocks_button_path_idx" ON "app_download_guide_blocks_button" USING btree ("_path");
  CREATE INDEX "app_download_guide_blocks_step_order_idx" ON "app_download_guide_blocks_step" USING btree ("_order");
  CREATE INDEX "app_download_guide_blocks_step_parent_id_idx" ON "app_download_guide_blocks_step" USING btree ("_parent_id");
  CREATE INDEX "app_download_guide_blocks_step_path_idx" ON "app_download_guide_blocks_step" USING btree ("_path");
  CREATE INDEX "app_download_guide_blocks_step_image_idx" ON "app_download_guide_blocks_step" USING btree ("image_id");
  CREATE INDEX "app_download_guide_blocks_qrcode_order_idx" ON "app_download_guide_blocks_qrcode" USING btree ("_order");
  CREATE INDEX "app_download_guide_blocks_qrcode_parent_id_idx" ON "app_download_guide_blocks_qrcode" USING btree ("_parent_id");
  CREATE INDEX "app_download_guide_blocks_qrcode_path_idx" ON "app_download_guide_blocks_qrcode" USING btree ("_path");
  CREATE INDEX "app_download_guide_blocks_qrcode_image_idx" ON "app_download_guide_blocks_qrcode" USING btree ("image_id");
  CREATE INDEX "app_download_guide_blocks_callout_order_idx" ON "app_download_guide_blocks_callout" USING btree ("_order");
  CREATE INDEX "app_download_guide_blocks_callout_parent_id_idx" ON "app_download_guide_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "app_download_guide_blocks_callout_path_idx" ON "app_download_guide_blocks_callout" USING btree ("_path");
  CREATE INDEX "find_us_guide_blocks_rich_text_order_idx" ON "find_us_guide_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "find_us_guide_blocks_rich_text_parent_id_idx" ON "find_us_guide_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "find_us_guide_blocks_rich_text_path_idx" ON "find_us_guide_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "find_us_guide_blocks_image_order_idx" ON "find_us_guide_blocks_image" USING btree ("_order");
  CREATE INDEX "find_us_guide_blocks_image_parent_id_idx" ON "find_us_guide_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "find_us_guide_blocks_image_path_idx" ON "find_us_guide_blocks_image" USING btree ("_path");
  CREATE INDEX "find_us_guide_blocks_image_image_idx" ON "find_us_guide_blocks_image" USING btree ("image_id");
  CREATE INDEX "find_us_guide_blocks_button_order_idx" ON "find_us_guide_blocks_button" USING btree ("_order");
  CREATE INDEX "find_us_guide_blocks_button_parent_id_idx" ON "find_us_guide_blocks_button" USING btree ("_parent_id");
  CREATE INDEX "find_us_guide_blocks_button_path_idx" ON "find_us_guide_blocks_button" USING btree ("_path");
  CREATE INDEX "find_us_guide_blocks_step_order_idx" ON "find_us_guide_blocks_step" USING btree ("_order");
  CREATE INDEX "find_us_guide_blocks_step_parent_id_idx" ON "find_us_guide_blocks_step" USING btree ("_parent_id");
  CREATE INDEX "find_us_guide_blocks_step_path_idx" ON "find_us_guide_blocks_step" USING btree ("_path");
  CREATE INDEX "find_us_guide_blocks_step_image_idx" ON "find_us_guide_blocks_step" USING btree ("image_id");
  CREATE INDEX "find_us_guide_blocks_qrcode_order_idx" ON "find_us_guide_blocks_qrcode" USING btree ("_order");
  CREATE INDEX "find_us_guide_blocks_qrcode_parent_id_idx" ON "find_us_guide_blocks_qrcode" USING btree ("_parent_id");
  CREATE INDEX "find_us_guide_blocks_qrcode_path_idx" ON "find_us_guide_blocks_qrcode" USING btree ("_path");
  CREATE INDEX "find_us_guide_blocks_qrcode_image_idx" ON "find_us_guide_blocks_qrcode" USING btree ("image_id");
  CREATE INDEX "find_us_guide_blocks_callout_order_idx" ON "find_us_guide_blocks_callout" USING btree ("_order");
  CREATE INDEX "find_us_guide_blocks_callout_parent_id_idx" ON "find_us_guide_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "find_us_guide_blocks_callout_path_idx" ON "find_us_guide_blocks_callout" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "app_download_guide_blocks_rich_text" CASCADE;
  DROP TABLE "app_download_guide_blocks_image" CASCADE;
  DROP TABLE "app_download_guide_blocks_button" CASCADE;
  DROP TABLE "app_download_guide_blocks_step" CASCADE;
  DROP TABLE "app_download_guide_blocks_qrcode" CASCADE;
  DROP TABLE "app_download_guide_blocks_callout" CASCADE;
  DROP TABLE "app_download_guide" CASCADE;
  DROP TABLE "find_us_guide_blocks_rich_text" CASCADE;
  DROP TABLE "find_us_guide_blocks_image" CASCADE;
  DROP TABLE "find_us_guide_blocks_button" CASCADE;
  DROP TABLE "find_us_guide_blocks_step" CASCADE;
  DROP TABLE "find_us_guide_blocks_qrcode" CASCADE;
  DROP TABLE "find_us_guide_blocks_callout" CASCADE;
  DROP TABLE "find_us_guide" CASCADE;
  DROP TYPE "public"."enum_app_download_guide_blocks_button_style";
  DROP TYPE "public"."enum_app_download_guide_blocks_callout_tone";
  DROP TYPE "public"."enum_find_us_guide_blocks_button_style";
  DROP TYPE "public"."enum_find_us_guide_blocks_callout_tone";`)
}
