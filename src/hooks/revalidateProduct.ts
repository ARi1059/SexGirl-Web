import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'
import { revalidatePath } from 'next/cache'

// 保存/删除商品后刷新前台缓存（ISR on-demand，开发文档 §8.4）。
// 覆盖：首页 `/`、详情 `/p/{id}`、今日可接单 `/c/today`（availableToday 变动可能影响），
// 以及该商品所属分类页 `/c/{slug}`（改分类时新旧两页都刷）。
// 包 try/catch：迁移 / seed 等非请求上下文调用 revalidatePath 会抛错，整体忽略。

// 把 category 字段（可能是未展开的 id，或已展开的对象）解析为 slug。
async function categorySlug(req: PayloadRequest, category: unknown): Promise<string | null> {
  if (category == null) return null
  if (typeof category === 'object') {
    const s = (category as { slug?: unknown }).slug
    return typeof s === 'string' ? s : null
  }
  try {
    const cat = await req.payload.findByID({
      collection: 'categories',
      id: category as number,
      depth: 0,
    })
    return typeof cat?.slug === 'string' ? cat.slug : null
  } catch {
    return null
  }
}

async function revalidate(
  req: PayloadRequest,
  doc: { id?: string | number; category?: unknown } | undefined,
  previousDoc?: { category?: unknown },
) {
  try {
    // revalidatePath 在非请求上下文（迁移/seed）会抛错——先调它，抛了就整体跳过，省去下方多余查询。
    revalidatePath('/')
    revalidatePath('/c/today')
    if (doc?.id != null) revalidatePath(`/p/${doc.id}`)

    const slugs = new Set<string>()
    const current = await categorySlug(req, doc?.category)
    if (current) slugs.add(current)
    if (previousDoc) {
      const prev = await categorySlug(req, previousDoc.category)
      if (prev) slugs.add(prev)
    }
    for (const s of slugs) revalidatePath(`/c/${s}`)
  } catch {
    /* 非请求上下文，忽略 */
  }
}

export const revalidateProduct: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  await revalidate(req, doc, previousDoc)
  return doc
}

export const revalidateProductDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await revalidate(req, doc)
  return doc
}
