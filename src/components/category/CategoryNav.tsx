"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/payload-types";
import { cn } from "@/lib/utils";

/**
 * 分类导航条（设计规范 §6.2 眉标风，开发计划 M6-5）。
 * 列：全部 / 今日可接单 / 各商品类型（按 sortOrder）。usePathname 高亮当前分类。
 * 仅因高亮态需要 pathname 而为 client；分类数据由 server 页面读取后以 props 传入，不在此拉取。
 */
export function CategoryNav({
  categories,
  className,
}: {
  categories: Category[];
  className?: string;
}) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "全部" },
    { href: "/c/today", label: "今日可接单" },
    ...categories
      .filter((c): c is Category & { slug: string } => Boolean(c.slug))
      .map((c) => ({ href: `/c/${c.slug}`, label: c.name })),
  ];

  return (
    <nav aria-label="商品分类" className={cn("border-y border-line", className)}>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-1 py-3 text-overline uppercase">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "draw-underline inline-block py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
                  active ? "text-accent" : "text-ink-muted hover:text-ink",
                )}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
