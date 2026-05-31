"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import type { Media } from "@/payload-types";
import { cn } from "@/lib/utils";

/** 取 Media 的可用 url（优先原图；列表小图可走 sizes，但二维码用原图保清晰） */
function mediaUrl(m: Media | number | null | undefined): string | null {
  if (!m || typeof m === "number") return null;
  return m.url ?? null;
}

/**
 * 二维码展示：1:1 发丝线方框 + 说明文字；点击放大到居中遮罩层，
 * 移动端长按可触发系统「保存图片」（靠原生 <img> 长按菜单）。尊重 reduced-motion。
 * 二维码图来自本地 seed（磁盘存储），M2 阶段用原生 <img unoptimized> 避免提前依赖
 * M4-3 的 remotePatterns 配置；详情页大图走 next/image 由 M3 接入。
 */
export function QrViewer({ image, hint }: { image: Media | number | null | undefined; hint: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const url = mediaUrl(image);

  if (!url) return null;

  return (
    <>
      <figure className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="放大二维码"
          className="border border-line p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={hint} width={132} height={132} className="block h-[132px] w-[132px] object-cover" />
        </button>
        <figcaption className="text-xs text-ink-subtle">{hint}</figcaption>
      </figure>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.001 : 0.24 }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="二维码大图"
          >
            <motion.div
              className="relative bg-paper p-4"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: reduce ? 0.001 : 0.24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className={cn(
                  "absolute -right-3 -top-3 grid h-8 w-8 place-items-center border border-ink bg-paper text-ink",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
                )}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={hint} className="block h-auto w-[min(78vw,360px)] object-contain" />
              <p className="mt-2 text-center text-xs text-ink-subtle">长按保存 / 扫码添加</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
