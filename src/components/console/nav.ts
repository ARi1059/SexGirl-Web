// 后台导航的单一数据源（Sidebar 高亮 + Header 面包屑共用，避免两处重复）。
// group：侧栏按分组渲染小标题（与设计稿 AdminSidebar 的 NAV_GROUPS 一致）。
export type NavItem = { href: string; label: string; group: string };

export const NAV: NavItem[] = [
  { href: "/admin", label: "仪表盘", group: "内容管理" },
  { href: "/admin/products", label: "商品管理", group: "内容管理" },
  { href: "/admin/categories", label: "商品分类", group: "内容管理" },
  { href: "/admin/contacts", label: "客服联系", group: "内容管理" },
  { href: "/admin/media", label: "媒体库", group: "内容管理" },
  { href: "/admin/customers", label: "客户管理", group: "会员与客服" },
  { href: "/admin/favorites", label: "用户收藏", group: "会员与客服" },
  { href: "/admin/users", label: "管理员", group: "会员与客服" },
  { href: "/admin/settings", label: "网站全局设置", group: "网站配置" },
];

// 侧栏分组顺序（按 NAV 出现顺序去重）。
export const NAV_GROUPS: string[] = [...new Set(NAV.map((n) => n.group))];

// 当前激活项：最长前缀匹配；/admin 仅精确匹配（否则会吃掉所有子路由）。
export function activeHref(pathname: string): string {
  const match = NAV.filter((n) =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? "/admin";
}

export function labelFor(pathname: string): string {
  const href = activeHref(pathname);
  return NAV.find((n) => n.href === href)?.label ?? "仪表盘";
}
