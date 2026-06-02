import type { CollectionConfig } from 'payload'
import { isAdmin, isSuperAdmin } from '../access/roles'
import { cleanupFavoritesByCustomer } from '../hooks/cleanupFavorites'

// 前台客户账号（第二个 auth 集合，与管理员 users 完全隔离）。开发文档 §4 / §7.5 / 决策 #7–8。
// 最小可用：用户名 + 密码，不强制邮箱、不做找回密码。客户不得进入 /admin。
export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: {
    // 用户名登录，关邮箱登录、不强制邮箱（契合「自设用户名+密码」）。
    loginWithUsername: { allowEmailLogin: false, requireEmail: false },
  },
  labels: { singular: '会员', plural: '会员' },
  admin: { useAsTitle: 'username', defaultColumns: ['username', 'nickname', 'createdAt'], group: '会员与客服' },
  // 删客户前先清其收藏（favorites.customer 为 required，FK ON DELETE SET NULL 会撞 NOT NULL）。
  hooks: { beforeDelete: [cleanupFavoritesByCustomer] },
  access: {
    // 客户绝不能进入后台（开发文档 §8.6 / 风险 #4）。
    admin: () => false,
    // 公开注册。
    create: () => true,
    // 管理员可查全部（支持/排查）；客户仅能读自己。
    read: ({ req }) => (isAdmin({ req }) ? true : { id: { equals: req.user?.id } }),
    // 仅本人改自己（管理员不代改，避免越权改密码/资料）。
    update: ({ req }) => ({ id: { equals: req.user?.id } }),
    // 超管或本人可删。
    delete: ({ req }) => (isSuperAdmin({ req }) ? true : { id: { equals: req.user?.id } }),
  },
  fields: [{ name: 'nickname', type: 'text', label: '昵称' }],
}
