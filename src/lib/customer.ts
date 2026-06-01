import { headers as nextHeaders } from "next/headers";
import { getPayloadClient } from "@/lib/payload";
import type { Customer } from "@/payload-types";

// 当前登录客户读取（Server Component 用，开发计划 M7-4）。开发文档 §7.5。
// payload.auth 解析请求 cookie；仅当来源集合为 customers 才返回，
// 避免把管理员会话误当客户（两套 auth 隔离，§4.1）。
export async function getCurrentCustomer(): Promise<Customer | null> {
  const payload = await getPayloadClient();
  const headers = await nextHeaders(); // Next 16：headers() 为异步
  const { user } = await payload.auth({ headers });
  if (user && user.collection === "customers") return user as Customer;
  return null;
}
