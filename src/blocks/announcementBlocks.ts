import type { Block } from 'payload'

// 公告 Blocks —— 「高度自定义」的源头：超管用这些积木自由拼版（同 tagBlocks 的配置驱动思路）。
// 新增一类版式 = 加一个 Block + 前台 <AnnouncementBody> 一个分支（前台渲染等 Figma 出稿）。
// 两个公告 Global（globals/announcements.ts）共用下方的 announcementBlocks 调色板。
// richText 字段自动继承 payload.config 的 lexicalEditor()，无需逐字段指定 editor。

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: '富文本段落', plural: '富文本段落' },
  fields: [{ name: 'content', type: 'richText', label: '正文' }],
}

export const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: '图片', plural: '图片' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true, label: '图片' },
    { name: 'caption', type: 'text', label: '图注（可选）' },
  ],
}

export const ButtonBlock: Block = {
  slug: 'button',
  labels: { singular: '按钮', plural: '按钮' },
  fields: [
    { name: 'label', type: 'text', required: true, label: '按钮文字' },
    { name: 'url', type: 'text', required: true, label: '链接' },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'primary',
      label: '样式',
      options: [
        { label: '主按钮', value: 'primary' },
        { label: '次按钮', value: 'secondary' },
        { label: '描边', value: 'outline' },
      ],
    },
    { name: 'icon', type: 'text', label: '图标名（Lucide，可选）' },
  ],
}

export const StepBlock: Block = {
  slug: 'step',
  labels: { singular: '图文步骤', plural: '图文步骤' },
  fields: [
    { name: 'title', type: 'text', required: true, label: '步骤标题' },
    { name: 'body', type: 'richText', label: '步骤说明' },
    { name: 'image', type: 'upload', relationTo: 'media', label: '配图（可选）' },
  ],
}

export const QrCodeBlock: Block = {
  slug: 'qrcode',
  labels: { singular: '二维码', plural: '二维码' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true, label: '二维码图片' },
    { name: 'label', type: 'text', label: '标题（如：扫码加微信）' },
    { name: 'caption', type: 'text', label: '说明（可选）' },
  ],
}

export const CalloutBlock: Block = {
  slug: 'callout',
  labels: { singular: '提示框', plural: '提示框' },
  fields: [
    {
      name: 'tone',
      type: 'select',
      defaultValue: 'info',
      label: '语气',
      options: [
        { label: '信息', value: 'info' },
        { label: '警告', value: 'warning' },
        { label: '成功', value: 'success' },
      ],
    },
    { name: 'content', type: 'richText', label: '内容' },
  ],
}

// 下载按钮 —— 引用「安装包」集合（collections/Downloads）里上传的文件，前台渲染成原生下载按钮。
// 专给「App 下载教学」用，但两 Global 共用调色板故对两页都可用。file 关系在 depth:2 已展开
// （body → download 块 → file 恰好两层，与 image 同），前台 DownloadBtn 据 platform 选图标。
export const DownloadBlock: Block = {
  slug: 'download',
  labels: { singular: '下载按钮', plural: '下载按钮' },
  fields: [
    { name: 'file', type: 'upload', relationTo: 'downloads', required: true, label: '安装包文件' },
    { name: 'label', type: 'text', required: true, label: '按钮文字（如：下载安卓版）' },
    {
      name: 'platform',
      type: 'select',
      defaultValue: 'other',
      label: '平台（决定图标）',
      options: [
        { label: '安卓 Android', value: 'android' },
        { label: '苹果 iOS', value: 'ios' },
        { label: '其他', value: 'other' },
      ],
    },
    { name: 'version', type: 'text', label: '版本号（可选，如 v2.3.1）' },
    { name: 'note', type: 'text', label: '说明（可选，如 支持安卓 7.0+）' },
  ],
}

// 两个公告 Global 共用的调色板。增减积木只改这里一处。
export const announcementBlocks: Block[] = [
  RichTextBlock,
  ImageBlock,
  ButtonBlock,
  StepBlock,
  QrCodeBlock,
  CalloutBlock,
  DownloadBlock,
]
