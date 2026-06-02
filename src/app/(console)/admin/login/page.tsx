import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentAdmin } from "@/lib/admin";
import { LoginForm } from "@/components/console/LoginForm";

export const metadata: Metadata = { title: "登录 · 定制商品后台" };

// 管理员登录页 /admin/login —— 在 (panel) 鉴权门之外（公开）。
// 已登录管理员直接跳仪表盘，避免重复登录。LoginForm 用 useSearchParams 读 redirect，
// 须裹 Suspense（Next 16 约定）。
export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <div className="relative grid min-h-screen place-items-center bg-surface px-6">
      {/* 玫瑰径向氛围光（与前台 accent 同色）*/}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,106,114,0.06) 0%, transparent 60%)",
        }}
      />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
