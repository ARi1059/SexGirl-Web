"use client";

import { useEffect, useState } from "react";

/** 主题切换：切换 <html>.dark 并持久化到 localStorage（设计规范 §3 / §6.7） */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = document.documentElement.classList.toggle("dark");
    setDark(next);
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
