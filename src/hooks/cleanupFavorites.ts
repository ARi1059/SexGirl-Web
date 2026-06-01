import type { CollectionBeforeDeleteHook } from 'payload'

// 删除商品 / 客户前，先级联删除引用它的收藏记录。
// 原因（已实测）：favorites 的 customer/product 为 required（列 NOT NULL），而 Payload
// 为关系字段生成的外键是 ON DELETE SET NULL —— 直接删被收藏的商品/客户，Postgres 会试图把
// 收藏行的外键置 NULL，撞 NOT NULL 约束而报错。join 表语义本就该随两端任一删除而消失，
// 故在 beforeDelete 主动删依赖收藏，等价 CASCADE。
// overrideAccess:true：本是后台管理员上下文，Favorites.delete 仅放行「客户删自己的」，
// 这里需绕过 access 做系统级清理（与前台 REST 走 access 的收藏取消互不影响）。
const cleanupFavoritesBy =
  (field: 'product' | 'customer'): CollectionBeforeDeleteHook =>
  async ({ req, id }) => {
    try {
      await req.payload.delete({
        collection: 'favorites',
        where: { [field]: { equals: id } },
        overrideAccess: true,
        req,
      })
    } catch {
      /* 无依赖收藏或非请求上下文，忽略 */
    }
  }

export const cleanupFavoritesByProduct = cleanupFavoritesBy('product')
export const cleanupFavoritesByCustomer = cleanupFavoritesBy('customer')
