import type { Endpoint, PayloadRequest } from 'payload'
import { isAdmin } from '../access/roles'

// 「今日可制作」批量重置（开发计划 M4-2）。
// 后台自定义按钮（components/admin/ResetAvailableTodayButton）POST 到此端点，
// 一键把所有 availableToday=true 的商品清零。挂载在默认 routes.api 下：
//   POST /api/reset-available-today
//
// 鉴权：复用集合级 isAdmin（admin / superadmin）。Payload 走 cookie 会话
// （auth.jwtOrder 含 'cookie'），同源 fetch credentials:'include' 会带上。
// 未登录 / 非管理员 → 401/403，不暴露操作。
//
// 批量更新经 ManyOptions（where + data），逐条触发 Products.afterChange
// → revalidateProduct，前台 ISR 缓存随之刷新（与 M4-1 同一条链路）。
export const resetAvailableToday: Endpoint = {
  path: '/reset-available-today',
  method: 'post',
  handler: async (req: PayloadRequest): Promise<Response> => {
    if (!req.user) {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (!isAdmin({ req })) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }

    const result = await req.payload.update({
      collection: 'products',
      where: { availableToday: { equals: true } },
      data: { availableToday: false },
      // 在当前请求事务/用户上下文中执行，让 afterChange(revalidate) 拿到正确 req。
      req,
    })

    const updated = result.docs.length
    const failed = result.errors.length
    return Response.json({ success: true, updated, failed })
  },
}
