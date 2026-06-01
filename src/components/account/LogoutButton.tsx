"use client";

import { useFavorites } from "@/components/favorite/FavoritesProvider";

// 个人中心退出按钮（client，开发计划 M7-9）。复用 FavoritesProvider 的 logout（清会话 cookie + 态）。
export function LogoutButton() {
  const { logout } = useFavorites();
  return (
    <button
      type="button"
      onClick={() => logout()}
      className="draw-underline shrink-0 text-overline uppercase text-ink-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
    >
      退出登录
    </button>
  );
}
