import type { ReactNode } from "react";
import { requireSuperAdmin } from "@/lib/admin";

// 外观主题段的超管门：在父层 (panel)/layout 的 requireAdmin 之上再要求超管，纵深防御。
// 仅超级管理员可进 /admin/appearance；普通管理员会被 requireSuperAdmin 跳回 /admin。
// 与 globals/appearance.ts 的 access.update = isSuperAdmin 对齐（UI 门 + 服务端 access 双重把关）。
export default async function AppearanceLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin();
  return <>{children}</>;
}
