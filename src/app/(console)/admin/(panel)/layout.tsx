import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import { Sidebar } from "@/components/console/Sidebar";
import { Header } from "@/components/console/Header";

// 受保护后台区外壳。顶部服务端鉴权门 requireAdmin：非管理员（未登录 / 前台客户）
// 一律跳 /admin/login。一处守住整片 /admin/* 受保护页。
// 布局：左侧常暗侧边栏 + 右侧（顶栏 + 内容）。
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const adminName = admin.name?.trim() || admin.email;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header adminName={adminName} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
