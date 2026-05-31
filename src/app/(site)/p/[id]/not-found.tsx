import Link from "next/link";

// 详情 404（设计规范 §9 语气：克制一句 + 一个 CTA）。
export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(20px,5vw,96px)] py-[clamp(64px,12vw,160px)]">
      <p className="text-overline uppercase tracking-[0.16em] text-accent">404</p>
      <h1 className="mt-4 font-display text-display-l font-semibold">未找到该商品</h1>
      <p className="mt-4 max-w-prose text-body text-ink-muted">它可能已下架，或链接有误。</p>
      <Link
        href="/"
        className="group mt-8 inline-flex items-center gap-1 text-body font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
      >
        <span aria-hidden>←</span>
        <span className="draw-underline">返回画廊</span>
      </Link>
    </div>
  );
}
