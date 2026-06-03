import type { GlobalConfig, PayloadRequest } from 'payload'
import { isSuperAdmin } from '../access/roles'
import { announcementBlocks } from '../blocks/announcementBlocks'

// 公告栏 —— 两篇高度自定义的单例公告：① App 下载教学 ② 如何永久找到我们。
// 设计同 globals/SiteSettings.ts（单例 Global），但**仅超级管理员**可编辑：
//   - access.update = isSuperAdmin：普通管理员改不了（权限边界，硬约束）。
//   - admin.hidden（按 role）：非超管在 /cms 既看不到导航项、也进不去编辑路由（Payload 3.85
//     的 hidden 同时排除 nav 与 routes）。read 公开，前台 findGlobal 可读，不受 hidden 影响。
// 「高度自定义」靠 body 的 blocks 调色板（blocks/announcementBlocks.ts）：超管自由拼版，不改代码。
// 前台展示页 + block 渲染 + revalidate 钩子等 Figma 出稿后再做（见 plan）。

type AnnouncementArgs = { slug: string; label: string; defaultTitle: string }

// 非超管隐藏：role 取自登录用户（users 集合的 select 字段，取值 admin/superadmin）。
// 参数用 Payload 的 user 类型（Customer | User | null），role 经 cast 取出（同 access/roles.ts 写法）。
const onlySuperAdminVisible = ({ user }: { user: PayloadRequest['user'] }): boolean =>
  (user as { role?: string } | null | undefined)?.role !== 'superadmin'

const makeAnnouncement = ({ slug, label, defaultTitle }: AnnouncementArgs): GlobalConfig => ({
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
})

export const AppDownloadGuide: GlobalConfig = makeAnnouncement({
  slug: 'app-download-guide',
  label: 'App 下载教学',
  defaultTitle: 'App 下载教学',
})

export const FindUsGuide: GlobalConfig = makeAnnouncement({
  slug: 'find-us-guide',
  label: '如何永久找到我们',
  defaultTitle: '如何永久找到我们',
})
