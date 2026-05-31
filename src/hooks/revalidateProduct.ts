import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'

// 保存/删除商品后刷新前台缓存（ISR on-demand，开发文档 §8.4）。
// 包 try/catch：迁移 / seed 等非请求上下文调用时不致报错。
function revalidate(doc: { id?: string | number } | undefined) {
  try {
    revalidatePath('/')
    if (doc?.id != null) revalidatePath(`/p/${doc.id}`)
  } catch {
    /* 非请求上下文，忽略 */
  }
}

export const revalidateProduct: CollectionAfterChangeHook = ({ doc }) => {
  revalidate(doc)
  return doc
}

export const revalidateProductDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidate(doc)
  return doc
}
