import type { GlobalConfig, PayloadRequest } from 'payload'
import { revalidatePath } from 'next/cache'
import { isSuperAdmin } from '../access/roles'
import { announcementBlocks } from '../blocks/announcementBlocks'

// 公告栏 —— 两篇高度自定义的单例公告：① App 下载教学 ② 如何永久找到我们。
// 设计同 globals/SiteSettings.ts（单例 Global），但**仅超级管理员**可编辑：
//   - access.update = isSuperAdmin：普通管理员改不了（权限边界，硬约束）。
//   - admin.hidden（按 role）：非超管在 /cms 既看不到导航项、也进不去编辑路由（Payload 3.85
//     的 hidden 同时排除 nav 与 routes）。read 公开，前台 findGlobal 可读，不受 hidden 影响。
// 「高度自定义」靠 body 的 blocks 调色板（blocks/announcementBlocks.ts）：超管自由拼版，不改代码。
// 前台：/app-download 与 /find-us 两页读本 Global 渲染（app/(site)/、components/announce/、lib/announcements.ts）；
// 保存经下方 afterChange 钩子 revalidate 对应页。品牌化 /admin 内联编辑仍待后续，超管暂走 /cms。

type AnnouncementArgs = { slug: string; label: string; defaultTitle: string; route: string }

// 非超管隐藏：role 取自登录用户（users 集合的 select 字段，取值 admin/superadmin）。
// 参数用 Payload 的 user 类型（Customer | User | null），role 经 cast 取出（同 access/roles.ts 写法）。
const onlySuperAdminVisible = ({ user }: { user: PayloadRequest['user'] }): boolean =>
  (user as { role?: string } | null | undefined)?.role !== 'superadmin'

const makeAnnouncement = ({ slug, label, defaultTitle, route }: AnnouncementArgs): GlobalConfig => ({
  slug,
  label,
  access: { read: () => true, update: isSuperAdmin },
  admin: { group: '公告栏', hidden: onlySuperAdminVisible },
  fields: [
    { name: 'title', type: 'text', label: '标题', defaultValue: defaultTitle },
    {
      name: 'intro',
      type: 'textarea',
      label: '导语',
      admin: { description: '页面顶部简介，可留空' },
    },
    {
      name: 'body',
      type: 'blocks',
      label: '正文内容',
      blocks: announcementBlocks,
      admin: { description: '用积木自由拼版：富文本 / 图片 / 按钮 / 图文步骤 / 二维码 / 提示框' },
    },
  ],
  // 保存后刷新对应前台页（page 级，非 layout —— 两页彼此独立、不影响全站）。
  // try/catch 必需：seed / migrate 等非请求上下文调用 revalidatePath 会抛错，整体忽略。
  hooks: {
    afterChange: [
      async ({ doc }) => {
        try {
          revalidatePath(route)
        } catch {
          /* 非请求上下文，忽略 */
        }
        return doc
      },
    ],
  },
})

export const AppDownloadGuide: GlobalConfig = makeAnnouncement({
  slug: 'app-download-guide',
  label: 'App 下载教学',
  defaultTitle: 'App 下载教学',
  route: '/app-download',
})

export const FindUsGuide: GlobalConfig = makeAnnouncement({
  slug: 'find-us-guide',
  label: '如何永久找到我们',
  defaultTitle: '如何永久找到我们',
  route: '/find-us',
})
