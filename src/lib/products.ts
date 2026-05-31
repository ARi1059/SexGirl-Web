import { getPayloadClient } from "@/lib/payload";
import type { Product } from "@/payload-types";

// 前台商品读取链路（仅 Server Component / generateStaticParams 调用）。
// 集中 published 过滤、sortOrder 排序与 depth 约定，列表 / 详情共用。
// 注：依赖 @/lib/payload（间接 import @payload-config），天然 server-only，不会进 client 包。

/** 列表：已上架，按 sortOrder 倒序；depth 1 仅展开封面（列表不需要 contacts）。 */
export async function getPublishedProducts(): Promise<Product[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    where: { published: { equals: true } },
    sort: "-sortOrder",
    depth: 1,
    limit: 100,
  });
  return docs;
}

/**
 * 详情：按 id 取单个商品；depth 2 展开 contacts 及其 qrImage（Media 对象），
 * 供 ContactRenderer / QrViewer 读取 url。不存在返回 null（findByID 对缺失会抛错）。
 */
export async function getProductById(id: number): Promise<Product | null> {
  const payload = await getPayloadClient();
  try {
    return await payload.findByID({ collection: "products", id, depth: 2 });
  } catch {
    return null;
  }
}

/** generateStaticParams 用：仅已上架商品 id（草稿不预渲染）。 */
export async function getAllPublishedIds(): Promise<number[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    where: { published: { equals: true } },
    depth: 0,
    limit: 1000,
  });
  return docs.map((d) => d.id);
}
