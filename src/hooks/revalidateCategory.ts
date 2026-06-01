import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'

// 分类保存/删除后刷新前台缓存（开发文档 §8.5）。覆盖首页（含分类导航）与该分类页 /c/[slug]；
// 改名/改 slug 时一并刷新旧 slug 页，避免旧地址滞留。
// 包 try/catch：迁移 / seed 等非请求上下文调用时 revalidatePath 会抛错，忽略即可。
function revalidate(slugs: (string | null | undefined)[]) {
  try {
    revalidatePath('/')
    for (const s of slugs) {
      if (s) revalidatePath(`/c/${s}`)
    }
  } catch {
    /* 非请求上下文，忽略 */
  }
}

export const revalidateCategory: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  revalidate([doc?.slug, previousDoc?.slug])
  return doc
}

export const revalidateCategoryDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidate([doc?.slug])
  return doc
}
