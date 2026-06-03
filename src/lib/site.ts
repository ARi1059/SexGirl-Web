import { getPayloadClient } from "@/lib/payload";
import type { SiteSetting } from "@/payload-types";

// 网站全局设置读取层（server-only：依赖 getPayloadClient → @payload-config）。
// 前台各 Server Component 与后台 settings 页经此读 Global，空字段回退默认。
// DEFAULT_SETTINGS 是默认文案的唯一前端事实源，须与 globals/SiteSettings.ts 的 defaultValue 一致。
// client 表单只能 `import type { SiteSettingsResolved }`（类型擦除，不拉 server 代码进 bundle），
// 运行时默认值由 server page 作为 prop 传入。

export type SiteSettingsResolved = {
  siteName: string;
  siteSlogan: string;
  metaTitle: string;
  metaDesc: string;
  galleryTitle: string;
  galleryUnit: string;
  galleryTagSuffix: string;
  contactHint: string;
  wechatId: string;
  qqId: string;
  loginHint: string;
  registerHint: string;
  footerText: string;
  adminTitle: string;
};

export const DEFAULT_SETTINGS: SiteSettingsResolved = {
  siteName: "定制商品",
  siteSlogan: "私域专属",
  metaTitle: "定制商品展示",
  metaDesc: "精选定制商品画廊 —— 看中款式，微信 / QQ 私聊定制。",
  galleryTitle: "精选定制",
  galleryUnit: "款",
  galleryTagSuffix: "私域专属",
  contactHint: "看中款式，添加微信或 QQ，发送商品名称「{title}」即可开始定制",
  wechatId: "cdsexgirl_official",
  qqId: "88888888",
  loginHint: "浏览全程免登录，仅收藏与个人中心需要账号。",
  registerHint: "自设用户名与密码即可收藏心仪商品。浏览全程免登录，仅收藏与个人中心需要账号。",
  footerText: "定制商品展示 · 看中款式，微信 / QQ 私聊定制",
  adminTitle: "定制商品后台",
};

// 空串 / null 都回退默认（管理员清空字段时前台不显示空白）。
const pick = (v: string | null | undefined, fallback: string): string => {
  const t = typeof v === "string" ? v.trim() : "";
  return t || fallback;
};

/** 读网站全局设置，空字段回退 DEFAULT_SETTINGS。仅 Server Component 调用。 */
export async function getSiteSettings(): Promise<SiteSettingsResolved> {
  let s: SiteSetting | null = null;
  try {
    const payload = await getPayloadClient();
    s = await payload.findGlobal({ slug: "site-settings", depth: 0 });
  } catch {
    s = null; // global 未初始化 / 非请求上下文 → 全量回退默认
  }
  return {
    siteName: pick(s?.siteName, DEFAULT_SETTINGS.siteName),
    siteSlogan: pick(s?.siteSlogan, DEFAULT_SETTINGS.siteSlogan),
    metaTitle: pick(s?.metaTitle, DEFAULT_SETTINGS.metaTitle),
    metaDesc: pick(s?.metaDesc, DEFAULT_SETTINGS.metaDesc),
    galleryTitle: pick(s?.galleryTitle, DEFAULT_SETTINGS.galleryTitle),
    galleryUnit: pick(s?.galleryUnit, DEFAULT_SETTINGS.galleryUnit),
    galleryTagSuffix: pick(s?.galleryTagSuffix, DEFAULT_SETTINGS.galleryTagSuffix),
    contactHint: pick(s?.contactHint, DEFAULT_SETTINGS.contactHint),
    wechatId: pick(s?.wechatId, DEFAULT_SETTINGS.wechatId),
    qqId: pick(s?.qqId, DEFAULT_SETTINGS.qqId),
    loginHint: pick(s?.loginHint, DEFAULT_SETTINGS.loginHint),
    registerHint: pick(s?.registerHint, DEFAULT_SETTINGS.registerHint),
    footerText: pick(s?.footerText, DEFAULT_SETTINGS.footerText),
    adminTitle: pick(s?.adminTitle, DEFAULT_SETTINGS.adminTitle),
  };
}

/** 拼前台页面标题后缀：`<page> · <metaTitle>`。各页 generateMetadata 复用。 */
export function titleWithSuffix(page: string, s: SiteSettingsResolved): string {
  return `${page} · ${s.metaTitle}`;
}
