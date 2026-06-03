"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  Phone,
  Image as ImageIcon,
  Users,
  Heart,
  Settings,
  Sliders,
  ExternalLink,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { NAV, NAV_GROUPS, activeHref } from "./nav";

const ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/products": Package,
  "/admin/categories": Tag,
  "/admin/contacts": Phone,
  "/admin/media": ImageIcon,
  "/admin/customers": Users,
  "/admin/favorites": Heart,
  "/admin/users": Settings,
  "/admin/settings": Sliders,
};

/**
 * 后台侧边栏（client：usePathname 高亮当前项）。
 * 视觉：恒定深色面板 —— 与前台 .dark 主题无关，亮/暗模式下都保持深色（忠于原型）。
 * 故此处用固定色值而非主题令牌，这是有意为之的「常暗」面板；其余区域（顶栏/内容/卡片）
 * 才走主题令牌随 .dark 切换。
 */
export function Sidebar() {
  const pathname = usePathname();
  const active = activeHref(pathname);

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-[#1C181B]">
      {/* 品牌字标 */}
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 pb-6 pt-7">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#C96A72] font-display text-base font-bold text-white">
          定
        </div>
        <div>
          <div className="font-display text-[15px] font-semibold tracking-[0.04em] text-[#F4F0EE]">
            定制商品
          </div>
          <div className="mt-px text-[10px] tracking-[0.22em] text-[#776A61]">管理后台</div>
        </div>
      </div>

      {/* 导航（按分组渲染小标题，忠于设计稿 NAV_GROUPS） */}
      <nav className="flex-1 overflow-y-auto p-2.5">
        {NAV_GROUPS.map((group) => (
          <div key={group} className="mb-3">
            <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C534F]">
              {group}
            </div>
            {NAV.filter((n) => n.group === group).map(({ href, label }) => {
              const Icon = ICONS[href];
              const isActive = href === active;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${
                    isActive
                      ? "bg-[#C96A72] font-medium text-white"
                      : "text-[#B3A9A3] hover:bg-white/[0.06] hover:text-[#F4F0EE]"
                  }`}
                >
                  {Icon ? <Icon size={15} strokeWidth={isActive ? 2 : 1.75} /> : null}
                  <span className="flex-1">{label}</span>
                  {isActive ? <ChevronRight size={13} /> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 查看前台（跨 root layout → 整页跳转，用原生 a）*/}
      <div className="border-t border-white/[0.07] p-2.5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#C96A72] transition-colors hover:bg-[#C96A72]/10"
        >
          <ExternalLink size={14} />
          查看前台网站
        </a>
      </div>
    </aside>
  );
}
