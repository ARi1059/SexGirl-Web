import { getPayloadClient } from "@/lib/payload";
import type { Category, Product } from "@/payload-types";

// 分类读取链路（仅 Server Component / generateStaticParams 调用）。
// 沿用 lib/products 的约定：published 过滤、sortOrder 倒序、depth 1 仅展开封面。

/** 所有分类，按 sortOrder 倒序（值大者靠前，与商品排序一致）。导航与 generateStaticParams 用。 */
export async function getCategories(): Promise<Category[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "categories",
    sort: "-sortOrder",
    depth: 0,
    limit: 100,
  });
  return docs;
}

/** 按 slug 取单个分类；不存在返回 null（分类页据此 notFound）。 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  });
  return docs[0] ?? null;
}

/** 某分类下的已上架商品，按 sortOrder 倒序。 */
export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    where: { and: [{ published: { equals: true } }, { category: { equals: categoryId } }] },
    sort: "-sortOrder",
    depth: 1,
    limit: 100,
  });
  return docs;
}

/** 今日可接单的已上架商品（虚拟分类 /c/today，由 availableToday 驱动）。 */
export async function getAvailableTodayProducts(): Promise<Product[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    where: { and: [{ published: { equals: true } }, { availableToday: { equals: true } }] },
    sort: "-sortOrder",
    depth: 1,
    limit: 100,
  });
  return docs;
}
