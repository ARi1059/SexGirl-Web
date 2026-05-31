"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/payload-types";
import { resolveImage, type ResolvedImage } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * 详情多图轮播（开发计划 M3-5）。封面 + images[]，过滤未展开/缺失项（image 可为 null）。
 * 堆叠淡入切换 + 左右箭头 + 圆点；首图 eager 加载（详情 LCP），其余 lazy。
 * 首图（index 0）在 M3-6 包入 <ViewTransition> 承接列表卡封面的 morph。
 * 尊重 prefers-reduced-motion（淡入过渡用 motion-reduce:transition-none 关闭）。
 */
export function Carousel({ product }: { product: Product }) {
  const images: ResolvedImage[] = [
    resolveImage(product.coverImage, "full"),
    ...(product.images ?? []).map((it) => resolveImage(it.image, "full")),
  ].filter((x): x is ResolvedImage => x !== null);

  const [index, setIndex] = useState(0);

  if (!images.length) return null;
  const count = images.length;
  const go = (n: number) => setIndex((n + count) % count);

  return (
    <div className="flex flex-col gap-3">
      {/* 整个图盒承接列表卡封面 morph（与卡同名，设计规范 §7）*/}
      <ViewTransition name={`product-${product.id}`}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface">
        {images.map((img, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none",
              i === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={i !== index}
          >
            <Image
              src={img.url}
              alt={img.alt || product.title}
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover"
            />
          </div>
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="上一张"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-line bg-paper/80 text-ink backdrop-blur transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="下一张"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-line bg-paper/80 text-ink backdrop-blur transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
      </ViewTransition>

      {count > 1 && (
        <div className="flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`查看第 ${i + 1} 张，共 ${count} 张`}
              aria-current={i === index || undefined}
              className={cn(
                "h-1.5 w-6 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
                i === index ? "bg-accent" : "bg-line hover:bg-ink-subtle",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
