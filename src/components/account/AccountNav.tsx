"use client";

import Link from "next/link";
import { useFavorites } from "@/components/favorite/FavoritesProvider";

/**
 * 页眉账号入口（client，开发计划 M7-6）。消费 FavoritesProvider 的会员态：
 * - 未登录：登录 / 注册
 * - 已登录：个人中心 / 退出
 * 登录态仅在客户端读取（Provider），故 (site)/layout 保持 server + 静态，ISR 不被污染。
 * ready 前不渲染文字，避免「登录」闪成「个人中心」的抖动。
 */
export function AccountNav() {
  const { me, ready, logout } = useFavorites();

  if (!ready) {
    return <span className="inline-block h-5 w-16" aria-hidden />;
  }

  const linkCls =
    "draw-underline text-overline uppercase text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";

  if (!me) {
    return (
      <nav aria-label="账号" className="flex items-center gap-4">
        <Link href="/login" className={linkCls}>
          登录
        </Link>
        <Link href="/register" className={linkCls}>
          注册
        </Link>
      </nav>
    );
  }

  return (
    <nav aria-label="账号" className="flex items-center gap-4">
      <Link href="/me" className={linkCls}>
        个人中心
      </Link>
      <button type="button" onClick={() => logout()} className={linkCls}>
        退出
      </button>
    </nav>
  );
}
