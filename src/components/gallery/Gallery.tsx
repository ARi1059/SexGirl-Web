"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { Product } from "@/payload-types";
import { ProductCard } from "./ProductCard";
import { FavoriteButton } from "@/components/favorite/FavoriteButton";

/**
 * 画廊网格（设计规范 §4 / §7，开发计划 M3-3/M3-6）。
 * - 编辑式错落：.gallery 12 列、每第 5 张 feature；桌面奇数列由 CSS 下移半步（布局位移）。
 * - 入场动效：Motion 逐个 stagger（70ms）opacity + translateY，进视口触发一次。
 *
 * 关键：CSS 的 .card:nth-child(odd) translateY 偏移作用在 <li> 上；入场动效放在**内层**
 * motion.div，避免 motion 的内联 transform 覆盖 <li> 的布局偏移（两者作用在不同元素）。
 * reduced-motion 下入场仅淡入、无位移，<li> 的布局偏移按设计保留。
 */
export function Gallery({ products }: { products: Product[] }) {
  const reduce = useReducedMotion();

  if (!products.length) {
    return (
      <p className="text-body text-ink-muted">
        暂无上架商品，敬请期待新款。
      </p>
    );
  }

  return (
    <ul className="gallery">
      {products.map((p, i) => {
        const feature = (i + 1) % 5 === 0;
        return (
          <li key={p.id} className={feature ? "card card--feature" : "card"}>
            <motion.div
              className="relative"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{
                duration: reduce ? 0.001 : 0.48,
                ease: [0.22, 1, 0.36, 1],
                delay: reduce ? 0 : (i % 6) * 0.07,
              }}
            >
              <Link
                href={`/p/${p.id}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
              >
                <ProductCard product={p} feature={feature} />
              </Link>
              {/* 收藏按钮作为 <Link> 的同级覆盖在封面上：避免 <button> 嵌进 <a>（非法交互嵌套）。 */}
              <FavoriteButton
                productId={p.id}
                className="absolute right-3 top-3 z-10 h-9 w-9 rounded-[2px] border border-line bg-paper/70 backdrop-blur"
              />
            </motion.div>
          </li>
        );
      })}
    </ul>
  );
}
