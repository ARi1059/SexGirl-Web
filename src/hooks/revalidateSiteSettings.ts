import type { GlobalAfterChangeHook } from 'payload'
import { revalidatePath } from 'next/cache'

// 保存网站设置后刷新前台缓存。站点文案落在前台根 layout（全站可见），
// 故按 layout 级失效以根 layout 为根的整棵子树（首页/详情/会员页等都覆盖）。
// 包 try/catch：迁移 / seed 等非请求上下文调用 revalidatePath 会抛错，整体忽略（同 revalidateProduct）。
export const revalidateSiteSettings: GlobalAfterChangeHook = async ({ doc }) => {
  try {
    revalidatePath('/', 'layout')
  } catch {
    /* 非请求上下文，忽略 */
  }
  return doc
}
