import { getPayloadClient } from "@/lib/payload";
import { getCurrentCustomer } from "@/lib/customer";
import type { Product } from "@/payload-types";

// 当前客户的收藏商品（个人中心 /me 用，开发计划 M7-9）。
// 查 favorites where customer=本人，depth 2 展开 product 及其封面 Media，供画廊卡片复用。
// where 已显式按本人 id 收口，归属安全；未登录返回 []。
export async function getMyFavorites(): Promise<Product[]> {
  const customer = await getCurrentCustomer();
  if (!customer) return [];

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "favorites",
    where: { customer: { equals: customer.id } },
    depth: 2,
    limit: 200,
    sort: "-createdAt",
  });

  // product 可能是已展开对象，或被删商品留下的悬空 id —— 仅保留已展开且仍上架的。
  return docs
    .map((f) => f.product)
    .filter((p): p is Product => typeof p === "object" && p !== null)
    .filter((p) => p.published);
}
