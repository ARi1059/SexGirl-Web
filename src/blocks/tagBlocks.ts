import type { Block } from 'payload'

// 标签 Blocks —— 配置驱动渲染的源头（开发文档 §5 / 设计规范 §6.3）。
// 新增标签类型 = 加一个 Block + 前台 <TagRenderer> 一个分支。

export const TextTag: Block = {
  slug: 'text',
  labels: { singular: '文字标签', plural: '文字标签' },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'style', type: 'json', label: '自定义样式 { color, bg }' },
  ],
}

export const IconTag: Block = {
  slug: 'icon',
  labels: { singular: '图标标签', plural: '图标标签' },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'icon', type: 'text', required: true, label: '图标名（Lucide）' },
  ],
}

export const ColorBlockTag: Block = {
  slug: 'colorBlock',
  labels: { singular: '色块标签', plural: '色块标签' },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'style', type: 'json', required: true, label: '色块样式 { color, bg }' },
  ],
}

export const LinkTag: Block = {
  slug: 'link',
  labels: { singular: '链接标签', plural: '链接标签' },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'url', type: 'text', required: true },
  ],
}
