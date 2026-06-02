import type { CollectionConfig } from 'payload'
import { isAdmin, isCustomer } from '../access/roles'

// 收藏（customer ↔ product 多对多，仅增删、不可改）。开发文档 §4 / §7.7 / 决策 #7。
// 安全要点（开发计划 §5 风险 #2/#5）：
// - 两套 auth 不可混淆：所有 access 按 req.user.collection（isCustomer / isAdmin）判定来源；
//   不直接对任意登录态返回 {customer: id} 约束，避免 users 与 customers 的数字 id 撞车而越权。
// - 归属强制：beforeValidate 把 customer 写成当前登录客户，杜绝替他人收藏（前端传入不可信）。
// - 唯一索引 (customer, product) 防重复收藏。
export const Favorites: CollectionConfig = {
  slug: 'favorites',
  labels: { singular: '收藏', plural: '收藏记录' },
  admin: { useAsTitle: 'id', defaultColumns: ['customer', 'product', 'createdAt'], group: '会员与客服' },
  access: {
    // 后台仅管理员可查看（支持/排查），客户进不了 admin。
    admin: isAdmin,
    // 仅登录客户可收藏。
    create: isCustomer,
    // 管理员可读全部；客户仅读自己的；匿名/管理员以外一律不可读。
    read: ({ req }) => {
      if (isAdmin({ req })) return true
      if (isCustomer({ req })) return { customer: { equals: req.user?.id } }
      return false
    },
    // 仅本人可取消收藏；其余（含管理员）不经此删，避免跨集合 id 撞车。
    delete: ({ req }) => (isCustomer({ req }) ? { customer: { equals: req.user?.id } } : false),
    // 收藏只增删，不可改。
    update: () => false,
  },
  hooks: {
    // 归属强制为当前登录客户（仅客户能 create，此处再兜底，忽略前端传入的 customer）。
    beforeValidate: [
      ({ req, data }) => {
        if (data && isCustomer({ req })) data.customer = req.user?.id
        return data
      },
    ],
  },
  fields: [
    { name: 'customer', type: 'relationship', relationTo: 'customers', required: true, index: true },
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
  ],
  // 防重复收藏（开发文档 §4）。
  indexes: [{ fields: ['customer', 'product'], unique: true }],
}
