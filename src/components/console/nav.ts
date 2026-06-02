// 后台导航的单一数据源（Sidebar 高亮 + Header 面包屑共用，避免两处重复）。
export type NavItem = { href: string; label: string };

export const NAV: NavItem[] = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/categories", label: "商品分类" },
  { href: "/admin/contacts", label: "客服联系" },
  { href: "/admin/media", label: "媒体库" },
  { href: "/admin/customers", label: "客户管理" },
  { href: "/admin/favorites", label: "用户收藏" },
  { href: "/admin/users", label: "管理员" },
];

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
