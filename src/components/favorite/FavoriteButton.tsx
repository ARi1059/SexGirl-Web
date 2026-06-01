"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "./FavoritesProvider";
import { cn } from "@/lib/utils";

/**
 * 收藏按钮（client，心形 toggle，开发计划 M7-7）。消费 FavoritesProvider 共享态。
 * - 未登录点击 → Provider 引导去 /login。
 * - 已登录 → 乐观 toggle（Provider 内 POST/DELETE + 失败回滚）。
 * 用于画廊卡片（绝对定位覆盖封面，作为 <Link> 的同级兄弟，避免 <button> 嵌 <a>）与详情页。
 * preventDefault/stopPropagation：卡片场景下阻止冒泡触发外层链接跳转。
 * 尊重 prefers-reduced-motion（设计规范 §7）：点按缩放经 motion-reduce 关闭。
 */
export function FavoriteButton({
  productId,
  className,
  size = 20,
}: {
  productId: number;
  className?: string;
  size?: number;
}) {
  const { isFavorited, toggle } = useFavorites();
  const active = isFavorited(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-pressed={active}
      aria-label={active ? "取消收藏" : "收藏"}
      title={active ? "取消收藏" : "收藏"}
      className={cn(
        "group/fav grid place-items-center transition-transform active:scale-90 motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
        className,
      )}
    >
      <Heart
        size={size}
        strokeWidth={1.5}
        className={cn(
          "transition-colors",
          active ? "fill-accent text-accent" : "text-ink group-hover/fav:text-accent",
        )}
        aria-hidden
      />
    </button>
  );
}
