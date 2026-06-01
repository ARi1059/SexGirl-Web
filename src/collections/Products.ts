import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { revalidateProduct, revalidateProductDelete } from '../hooks/revalidateProduct'
import { TextTag, IconTag, ColorBlockTag, LinkTag } from '../blocks/tagBlocks'

// 商品（数据模型见开发文档 §4）。标签用 blocks，客服用关系，动态状态字段独立。
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'published', 'availableToday', 'category', 'sortOrder'],
  },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    afterChange: [revalidateProduct],
    afterDelete: [revalidateProductDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: '商品标题' },
    { name: 'description', type: 'richText', label: '描述（富文本）' },
    { name: 'coverImage', type: 'upload', relationTo: 'media', required: true, label: '封面图' },
    {
      name: 'images',
      type: 'array',
      label: '详情多图',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
    { name: 'published', type: 'checkbox', defaultValue: false, index: true, label: '上架' },
    { name: 'availableToday', type: 'checkbox', defaultValue: false, label: '今日可接单' },
    {
      name: 'availableTodayText',
      type: 'text',
      defaultValue: '今日可接单',
      label: '可接单文案',
      admin: {
        description: '「今日可接单」开启时卡片 / 详情显示的文字，可自定义（如「今日可约」）。',
      },
    },
    { name: 'statusText', type: 'text', label: '自定义状态文字（如：已约满）' },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: '商品类型',
      admin: { description: '前台分类页 /c/<slug> 据此筛选；可在「分类」集合维护类型。' },
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0, index: true, label: '排序权重' },
    {
      name: 'tags',
      type: 'blocks',
      label: '标签',
      blocks: [TextTag, IconTag, ColorBlockTag, LinkTag],
    },
    {
      name: 'contacts',
      type: 'relationship',
      relationTo: 'contacts',
      hasMany: true,
      label: '绑定客服',
    },
  ],
}
