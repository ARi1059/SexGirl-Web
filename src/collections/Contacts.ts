import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/roles'

// 客服联系方式（可被多个商品复用）。type 决定填微信/QQ 号还是上传二维码。
export const Contacts: CollectionConfig = {
  slug: 'contacts',
  admin: { useAsTitle: 'label', defaultColumns: ['label', 'type', 'value'] },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: '微信号', value: 'wechat' },
        { label: '微信二维码', value: 'wechatQr' },
        { label: 'QQ 号', value: 'qq' },
        { label: 'QQ 二维码', value: 'qqQr' },
      ],
    },
    { name: 'label', type: 'text', label: '显示名（如：定制客服 小美）' },
    {
      name: 'value',
      type: 'text',
      label: '微信号 / QQ 号',
      admin: { condition: (data) => ['wechat', 'qq'].includes(data?.type) },
    },
    {
      name: 'qrImage',
      type: 'upload',
      relationTo: 'media',
      label: '二维码图片',
      admin: { condition: (data) => ['wechatQr', 'qqQr'].includes(data?.type) },
    },
  ],
}
