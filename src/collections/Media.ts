import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/roles'

// 图片上传集合（封面 / 详情图 / 二维码统一走它）。
// 多尺寸对应设计规范 §5：thumbnail 列表 / card 卡片 / full 详情。
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: '图片', plural: '媒体库' },
  admin: { group: '系统' },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  upload: {
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 800 },
      { name: 'full', width: 1600 },
    ],
    focalPoint: true,
  },
  fields: [{ name: 'alt', type: 'text', label: '替代文字（无障碍 / SEO）' }],
}
