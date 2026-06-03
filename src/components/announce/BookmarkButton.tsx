"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";

// 「收藏本页」CTA（find-us 页面级装饰，非积木）。
// 现代浏览器禁止程序化加书签，故点按只显示快捷键提示，引导用户手动 ⌘D / Ctrl+D。
export function BookmarkButton() {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setShown(true)}
        className="inline-flex items-center justify-center gap-2 rounded-none bg-accent-strong px-7 py-3.5 text-[15px] font-medium text-on-accent transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
      >
        <Bookmark size={18} strokeWidth={1.5} aria-hidden />
        收藏本页（⌘D / Ctrl+D）
      </button>
      {shown ? (
        <p className="mt-3 text-small text-ink-muted" role="status">
          请按{" "}
          <kbd className="rounded-xs border border-line px-1.5 py-0.5 font-mono text-[12px] text-ink">⌘ D</kbd>{" "}
          （Windows 为{" "}
          <kbd className="rounded-xs border border-line px-1.5 py-0.5 font-mono text-[12px] text-ink">Ctrl + D</kbd>
          ）将本页加入书签。
        </p>
      ) : null}
    </div>
  );
}
