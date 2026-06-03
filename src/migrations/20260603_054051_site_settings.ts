import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT '定制商品',
  	"site_slogan" varchar DEFAULT '私域专属',
  	"meta_title" varchar DEFAULT '定制商品展示',
  	"meta_desc" varchar DEFAULT '精选定制商品画廊 —— 看中款式，微信 / QQ 私聊定制。',
  	"gallery_title" varchar DEFAULT '精选定制',
  	"gallery_unit" varchar DEFAULT '款',
  	"gallery_tag_suffix" varchar DEFAULT '私域专属',
  	"contact_hint" varchar DEFAULT '看中款式，添加微信或 QQ，发送商品名称「{title}」即可开始定制',
  	"wechat_id" varchar DEFAULT 'cdsexgirl_official',
  	"qq_id" varchar DEFAULT '88888888',
  	"login_hint" varchar DEFAULT '浏览全程免登录，仅收藏与个人中心需要账号。',
  	"register_hint" varchar DEFAULT '自设用户名与密码即可收藏心仪商品。浏览全程免登录，仅收藏与个人中心需要账号。',
  	"footer_text" varchar DEFAULT '定制商品展示 · 看中款式，微信 / QQ 私聊定制',
  	"admin_title" varchar DEFAULT '定制商品后台',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings" CASCADE;`)
}
