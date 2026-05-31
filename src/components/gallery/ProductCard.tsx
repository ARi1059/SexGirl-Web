import { ViewTransition } from "react";
import Image from "next/image";
import type { Product } from "@/payload-types";
import { resolveImage } from "@/lib/media";
import { TagRenderer } from "@/components/renderers/TagRenderer";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

/**
 * 画廊商品卡（设计规范 §6.4）：封面全出血竖图 + 发丝线 + 状态徽标 + 标题 + 标签。
 * 无边框无投影，靠图片与发丝线分隔。整卡由 Gallery 的 <Link> 包裹（含 group 用于 hover）。
 * feature 卡（每第 5 张）用横构图占更宽栅格。封面比例固定以防 CLS（不依赖 blur 占位）。
 * 同构组件（无 server-only 依赖），可被 client 的 Gallery 直接渲染。
 */
export function ProductCard({ product, feature = false }: { product: Product; feature?: boolean }) {
  const cover = resolveImage(product.coverImage, feature ? "full" : "card");
  const sizes = feature
    ? "(max-width: 1023px) 100vw, 66vw"
    : "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw";

  return (
    <>
      {/* 共享元素 morph：与详情首图同名（设计规范 §7）。仅包封面盒，不包整卡。 */}
      <ViewTransition name={`product-${product.id}`}>
        <div className={cn("relative overflow-hidden bg-surface", feature ? "aspect-[16/10]" : "aspect-[3/4]")}>
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || product.title}
              fill
              sizes={sizes}
              loading="lazy"
              className="object-cover transition-transform duration-[640ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : null}
        </div>
      </ViewTransition>

      <div className="mt-4 border-t border-line pt-4">
        <StatusBadge availableToday={product.availableToday} statusText={product.statusText} />
        <h3 className="mt-2 font-display text-h2 font-semibold leading-tight">
          <span className="draw-underline">{product.title}</span>
        </h3>
        <TagRenderer tags={product.tags} className="mt-3" />
      </div>
    </>
  );
}
