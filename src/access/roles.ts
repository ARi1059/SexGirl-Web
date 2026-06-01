import type { PayloadRequest } from 'payload'

// 角色判定：admin（管理商品/标签/客服）、superadmin（额外可管理账号）。
// 返回 boolean，可用于集合 access（read/create/update/delete）、admin 入口及字段级 access。
// 详见 docs/开发文档.md §8.1.1。
type RoleArgs = { req: PayloadRequest }

const roleOf = (req: PayloadRequest): string | undefined =>
  (req.user as { role?: string } | null | undefined)?.role

export const isAdmin = ({ req }: RoleArgs): boolean => {
  const r = roleOf(req)
  return r === 'admin' || r === 'superadmin'
}

export const isSuperAdmin = ({ req }: RoleArgs): boolean => roleOf(req) === 'superadmin'

// 前台客户判定（开发文档 §4.1）：按登录来源集合区分，而非 role。
// 管理员 users 无此 collection 值，故对客户请求 isAdmin 天然返回 false，两套鉴权互不越权。
export const isCustomer = ({ req }: RoleArgs): boolean => req.user?.collection === 'customers'
