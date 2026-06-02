import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { revalidateCategory, revalidateCategoryDelete } from '../hooks/revalidateCategory'

// URL slug 规范化：小写、把非 [a-z0-9] 段并成连字符、去首尾连字符。
// 纯中文名会得到空串 —— 此时要求管理员手填英文 slug（见字段 validate）。
const toSlug = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// 商品类型 / 分类（可复用，驱动前台 /c/[slug] 分类页与导航）。开发文档 §4 / §8.5。
// 与商品自由排列的 tags Blocks 互补：category 是结构化归类，前台据此生成分类页与导航。
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: '分类', plural: '分类' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'sortOrder'],
    group: '内容管理',
    // 编辑页「预览」按钮 → 前台分类页 /c/<slug>。
    preview: (doc) => (typeof doc?.slug === 'string' && doc.slug ? `/c/${doc.slug}` : null),
  },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    afterChange: [revalidateCategory],
    afterDelete: [revalidateCategoryDelete],
    // slug 缺省时由 name 派生；统一规范化。保留字 today 与空 slug 由字段 validate 拦截。
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        const raw =
          (typeof data.slug === 'string' && data.slug.trim()) ||
          (typeof data.name === 'string' ? data.name : '')
        if (raw) data.slug = toSlug(raw)
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: '类型名' },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'URL 标识',
      admin: {
        description:
          '用于分类页 /c/<slug>；留空将由类型名自动生成。纯中文类型名无法自动生成，请手填英文（如 evening-gown）。',
      },
      // 'today' 是「今日可接单」虚拟分类页的保留 slug（开发文档 §7.2），分类不可占用。
      validate: (value: string | null | undefined) => {
        const v = typeof value === 'string' ? value.trim() : ''
        if (!v) return '请填写 URL 标识（纯中文类型名无法自动生成，请填英文 slug，如 evening-gown）'
        if (v === 'today') return '“today” 为「今日可接单」虚拟分类保留字，请换一个'
        return true
      },
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0, index: true, label: '排序权重' },
  ],
}
