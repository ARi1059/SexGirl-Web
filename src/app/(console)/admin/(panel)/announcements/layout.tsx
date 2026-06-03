import type { ReactNode } from "react";
import { requireSuperAdmin } from "@/lib/admin";

// 公告栏编辑段的超管门：在父层 (panel)/layout 的 requireAdmin 之上再要求超管，纵深防御。
// 仅超级管理员可进 /admin/announcements/*；普通管理员会被 requireSuperAdmin 跳回 /admin。
export default async function AnnouncementsLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin();
  return <>{children}</>;
}
