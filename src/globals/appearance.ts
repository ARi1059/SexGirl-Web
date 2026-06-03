import type { GlobalConfig, PayloadRequest } from 'payload'
import { isSuperAdmin } from '../access/roles'
import { revalidateSiteSettings } from '../hooks/revalidateSiteSettings'

// 外观主题 —— 单例 Global，超级管理员切换前台网站主题（默认暖纸玫瑰粉 / iOS 苹果风）。
// 设计同 globals/announcements.ts 的超管门：
//   - access.update = isSuperAdmin：普通管理员改不了（权限边界，硬约束）。
//   - admin.hidden（按 role）：非超管在 /cms 既看不到导航项、也进不去编辑路由。read 公开，
//     前台 (site)/layout 经 lib/site.ts 的 getAppearance() 读取，据此在 <html> 落 data-skin。
// 换肤机制：前台组件全用语义令牌（--paper/--ink/--accent…，globals.css），iOS 主题在
//   [data-skin='ios'] 作用域重定义这批令牌即整站换肤，零组件改动（同 .dark 暗色的做法）。
// 仅作用前台 (site)；自建后台 /admin 控制台保持品牌主题，故 (console)/layout 不读本 Global。
const onlySuperAdminVisible = ({ user }: { user: PayloadRequest['user'] }): boolean =>
  (user as { role?: string } | null | undefined)?.role !== 'superadmin'

export const Appearance: GlobalConfig = {
  slug: 'appearance',
  label: '外观主题',
  access: { read: () => true, update: isSuperAdmin },
  admin: { group: '网站配置', hidden: onlySuperAdminVisible },
  // 保存后按 layout 级失效整站（data-skin 在前台根 layout 的 <html>，影响全站）。
  // 复用 revalidateSiteSettings：它是通用的 revalidatePath('/', 'layout') 钩子（含 try/catch）。
  hooks: { afterChange: [revalidateSiteSettings] },
  fields: [
    {
      name: 'theme',
      type: 'select',
      label: '网站主题',
      required: true,
      defaultValue: 'default',
      options: [
        { label: '默认 · 暖纸玫瑰粉', value: 'default' },
        { label: 'iOS · 苹果风', value: 'ios' },
      ],
      admin: { description: '切换前台网站整体配色与字体；保存后全站立即生效。仅影响前台，不影响后台控制台。' },
    },
  ],
}
