"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "./FavoritesProvider";

/**
 * 页眉收藏入口（client，UI Style Redesign v2）。消费 FavoritesProvider 的 count：
 * - 始终显示心形 → /me；count>0 时心形填充玫瑰粉并显示数字。
 * - ready 前不显示数字，避免 0→N 抖动。心形本身始终在位，布局不跳。
 * 必须挂在 <FavoritesProvider> 子树内（(site)/layout 已全站包裹）。
 */
export function FavoritesNavLink() {
  const { count, ready } = useFavorites();
  const active = ready && count > 0;

  return (
    <Link
      href="/me"
      aria-label={active ? `我的收藏（${count}）` : "我的收藏"}
      className="group flex items-center gap-1.5 text-ink-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
    >
      <Heart
        size={16}
        strokeWidth={1.5}
        className={active ? "fill-accent text-accent" : ""}
        aria-hidden
      />
      {active ? (
        <span className="text-overline font-semibold text-accent tabular-nums">{count}</span>
      ) : null}
    </Link>
  );
}
