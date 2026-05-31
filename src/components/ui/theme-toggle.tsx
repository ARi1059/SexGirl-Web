"use client";

import { useSyncExternalStore } from "react";

// 主题切换：切换 <html>.dark 并持久化到 localStorage（设计规范 §3 / §6.7）。
// 用 useSyncExternalStore 订阅 <html> 的 class 变化，反映首帧防闪烁脚本所定主题，
// 避免在 effect 内同步 setState（react-hooks/set-state-in-effect）。
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

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "切换到亮色主题" : "切换到暗色主题"}
      className="grid h-10 w-10 place-items-center text-lg text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
