"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Sun, Moon, LogOut } from "lucide-react";
import { labelFor } from "./nav";

// 订阅 <html>.dark 变化以反映首帧防闪烁脚本所定主题（与 ui/theme-toggle 同一模式，
// 避免在 effect 内同步 setState）。
function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}
function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}
function getServerSnapshot() {
  return false;
}

/**
 * 后台顶栏（client）：面包屑（按 pathname）+ 主题切换 + 管理员名/头像 + 退出。
 * adminName 由服务端 (panel)/layout 注入（已 requireAdmin），无需再拉 /me。
 */
export function Header({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const label = labelFor(pathname);
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    const next = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  async function logout() {
    try {
      await fetch("/api/users/logout", { method: "POST", credentials: "include" });
    } catch {}
    // 整页跳转：清掉客户端态，回登录页（cookie 已由 Payload 清除）。
    window.location.assign("/admin/login");
  }

  const initial = (adminName.trim()[0] ?? "A").toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-line bg-paper px-6">
      {/* 面包屑 */}
      <div className="flex flex-1 items-center gap-1.5 text-small">
        <span className="text-ink-subtle">定制商品后台</span>
        <span className="text-ink-subtle">/</span>
        <span className="font-medium text-ink">{label}</span>
      </div>

      {/* 主题切换 */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={dark ? "切换到亮色主题" : "切换到暗色主题"}
        className="grid size-8 place-items-center rounded-lg border border-line text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
      >
        {dark ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* 管理员 + 退出 */}
      <div className="flex items-center gap-2.5">
        <div className="grid size-7 place-items-center rounded-full bg-accent font-display text-xs font-semibold text-on-accent">
          {initial}
        </div>
        <span className="hidden text-small font-medium text-ink-muted sm:inline">{adminName}</span>
        <button
          type="button"
          onClick={logout}
          aria-label="退出登录"
          className="grid size-8 place-items-center rounded-lg border border-line text-ink-muted transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
