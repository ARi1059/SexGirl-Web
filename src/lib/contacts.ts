import { getPayloadClient } from "@/lib/payload";
import type { Contact } from "@/payload-types";

// 客服读取链路（Server Component 调用）。仿 lib/categories：depth 0 仅需 id/label/type。

/** 所有客服联系方式，后台商品「绑定客服」选项用。 */
export async function getContacts(): Promise<Contact[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "contacts",
    depth: 0,
    limit: 200,
  });
  return docs;
}
