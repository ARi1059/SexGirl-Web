"use client";

import { useCallback, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 一键复制按钮：navigator.clipboard 复制 value，2s 内显示「已复制」反馈（设计规范 §6.6）。
 * clipboard 不可用时降级到 document.execCommand('copy')，再失败则静默不报错。
 */
export function CopyButton({
  value,
  className,
  copiedLabel = "已复制",
  idleLabel = "复制",
}: {
  value: string;
  className?: string;
  copiedLabel?: string;
  idleLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败静默降级：用户仍可手动选中 value 文本
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? copiedLabel : `${idleLabel} ${value}`}
      className={cn(
        "inline-flex h-8 items-center gap-1 border border-ink px-3 text-xs text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
        className,
      )}
    >
      {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
      <span>{copied ? copiedLabel : idleLabel}</span>
    </button>
  );
}
