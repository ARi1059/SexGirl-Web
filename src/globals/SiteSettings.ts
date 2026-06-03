import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { revalidateSiteSettings } from '../hooks/revalidateSiteSettings'

// 网站全局设置（单例 Global）—— 站点级文案集中配置，前台经 lib/site.ts 读取，保存后 ISR 全站生效。
// 14 字段用 tabs 分 5 组：tabs 容器无 name → 子字段平铺为顶层列（有 name 会嵌成 JSON 列）。
// 各字段 defaultValue 与 lib/site.ts 的 DEFAULT_SETTINGS 必须一致（唯一事实源 = 设计稿）。
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '网站设置',
  access: { read: () => true, update: isAdmin },
  admin: { group: '内容管理' },
  hooks: { afterChange: [revalidateSiteSettings] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '网站基本信息',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              label: '网站名称',
              defaultValue: '定制商品',
              admin: { description: '导航栏 Logo 与浏览器标题' },
            },
            { name: 'siteSlogan', type: 'text', label: '网站副标题', defaultValue: '私域专属' },
            {
              name: 'metaTitle',
              type: 'text',
              label: '网页标题（title）',
              defaultValue: '定制商品展示',
              admin: { description: '浏览器标签 / SEO 标题；前台各页以「· 此值」为后缀' },
            },
            {
              name: 'metaDesc',
              type: 'textarea',
              label: '网页描述（meta description）',
              defaultValue: '精选定制商品画廊 —— 看中款式，微信 / QQ 私聊定制。',
            },
          ],
        },
        {
          label: '首页画廊',
          fields: [
            { name: 'galleryTitle', type: 'text', label: '画廊大标题', defaultValue: '精选定制' },
            {
              name: 'galleryUnit',
              type: 'text',
              label: '商品计数单位',
              defaultValue: '款',
              admin: { description: '如：款 / 件 / 套' },
            },
            {
              name: 'galleryTagSuffix',
              type: 'text',
              label: '计数后缀',
              defaultValue: '私域专属',
              admin: { description: '跟在数量后，如「9 款 · 私域专属」' },
            },
          ],
        },
        {
          label: '联系方式文案',
          fields: [
            {
              name: 'contactHint',
              type: 'textarea',
              label: '联系引导文案',
              defaultValue: '看中款式，添加微信或 QQ，发送商品名称「{title}」即可开始定制',
              admin: { description: '商品详情联系区底部；可用 {title} 插入当前商品名' },
            },
            {
              name: 'wechatId',
              type: 'text',
              label: '微信号',
              defaultValue: 'cdsexgirl_official',
              admin: {
                description: '站点级记录；前台联系展示仍以各商品绑定的客服为准（暂不展示此字段）',
              },
            },
            {
              name: 'qqId',
              type: 'text',
              label: 'QQ 号',
              defaultValue: '88888888',
              admin: { description: '同上，站点级记录用途' },
            },
          ],
        },
        {
          label: '会员页文案',
          fields: [
            {
              name: 'loginHint',
              type: 'textarea',
              label: '登录页提示',
              defaultValue: '浏览全程免登录，仅收藏与个人中心需要账号。',
            },
            {
              name: 'registerHint',
              type: 'textarea',
              label: '注册页说明',
              defaultValue: '自设用户名与密码即可收藏心仪商品。浏览全程免登录，仅收藏与个人中心需要账号。',
            },
          ],
        },
        {
          label: '页脚与后台',
          fields: [
            {
              name: 'footerText',
              type: 'textarea',
              label: '页脚文字',
              defaultValue: '定制商品展示 · 看中款式，微信 / QQ 私聊定制',
            },
            {
              name: 'adminTitle',
              type: 'text',
              label: '后台标题后缀',
              defaultValue: '定制商品后台',
              admin: {
                description: '仅记录用途：Payload /cms 标签后缀为构建期静态值，暂不由此字段动态驱动',
              },
            },
          ],
        },
      ],
    },
  ],
}
