import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import type { User } from "@/payload-types";

// 当前登录管理员读取（Server Component 用）。镜像 lib/customer.ts 的 getCurrentCustomer：
// payload.auth 解析请求 cookie；仅当来源集合为 users 才返回，避免把前台 customers
// 会话误当管理员（两套 auth 隔离，见 access/roles.ts）。users 集合的 role 必为
// admin/superadmin，故 collection 命中即为合法管理员。
export async function getCurrentAdmin(): Promise<User | null> {
  const payload = await getPayloadClient();
  const headers = await nextHeaders(); // Next 16：headers() 为异步
  const { user } = await payload.auth({ headers });
  if (user && user.collection === "users") return user as User;
  return null;
}

// 受保护后台区的服务端鉴权门：非管理员一律跳登录页。
// 放在 (console)/admin/(panel)/layout.tsx 顶部，一处守住整片 /admin/* 受保护页。
// 登录页 /admin/login 在门外，不调用本函数。
export async function requireAdmin(): Promise<User> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
