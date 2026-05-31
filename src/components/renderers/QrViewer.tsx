"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import type { Media } from "@/payload-types";
import { resolveImage } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * 二维码展示：1:1 发丝线方框 + 说明文字；点击放大到居中遮罩层，
 * 移动端长按可触发系统「保存图片」。尊重 reduced-motion。
 * 走 next/image 满足「前台全部图片走 next/image」（开发计划 M4-4），
 * 但加 unoptimized 跳过 AVIF/WebP 有损压缩 —— 二维码是扫码/长按保存的引流
 * 关键，必须原图保真，不能被 q75 压花（设计规范 §6.6）。
 */
export function QrViewer({ image, hint }: { image: Media | number | null | undefined; hint: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  // thumbnail(400w) 已够清晰且自带宽高；取不到则回退原图（resolveImage 内置回退链）。
  const qr = resolveImage(image, "thumbnail");

  if (!qr) return null;

  return (
    <>
      <figure className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="放大二维码"
          className="border border-line p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        >
          <Image
            src={qr.url}
            alt={qr.alt || hint}
            width={132}
            height={132}
            unoptimized
            className="block h-[132px] w-[132px] object-cover"
          />
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
              {/* 放大图：用原图保真 + unoptimized；宽度受视口约束，高度按比例自适应 */}
              <Image
                src={qr.url}
                alt={qr.alt || hint}
                width={qr.width}
                height={qr.height}
                unoptimized
                sizes="(max-width: 767px) 78vw, 360px"
                className="block h-auto w-[min(78vw,360px)] object-contain"
              />
              <p className="mt-2 text-center text-xs text-ink-subtle">长按保存 / 扫码添加</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
