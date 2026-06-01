import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getProductById, getAllPublishedIds } from "@/lib/products";
import { Carousel } from "@/components/gallery/Carousel";
import { StatusBadge } from "@/components/gallery/StatusBadge";
import { TagRenderer } from "@/components/renderers/TagRenderer";
import { ContactSection } from "@/components/contact/ContactSection";
import { FavoriteButton } from "@/components/favorite/FavoriteButton";

// 商品详情页 /p/[id]（开发计划 M3-5）。ISR + 构建期预渲染已上架商品。
export const revalidate = 3600;

// 仅预渲染已上架商品；其余 id 走运行时（dynamicParams 默认 true），未上架/缺失 → notFound。
export async function generateStaticParams() {
  const ids = await getAllPublishedIds();
  return ids.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product || !product.published) return { title: "未找到 · 定制商品展示" };
  return {
    title: `${product.title} · 定制商品展示`,
    description: product.statusText ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // Next 16：params 为异步
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const product = await getProductById(numId);
  if (!product || !product.published) notFound(); // 未上架在前台不可见（设计规范 §6.2）

  // depth 2 已展开 category 为对象；可点眉标跳对应分类页（详情无外层 <Link>，可安全嵌 <a>）。
  const category =
    product.category && typeof product.category === "object" ? product.category : null;

  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(20px,5vw,96px)] py-[clamp(32px,6vw,80px)]">
      <Link
        href="/"
        className="group inline-flex items-center gap-1 text-overline uppercase tracking-[0.16em] text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
      >
        <span aria-hidden>←</span>
        <span className="draw-underline">返回画廊</span>
      </Link>

      <div className="mt-6 grid gap-[clamp(32px,5vw,72px)] lg:grid-cols-2 lg:items-start">
        {/* 左：多图轮播（桌面 sticky）。首图承接列表卡封面 morph（M3-6 接入 ViewTransition）。 */}
        <div className="lg:sticky lg:top-28">
          <Carousel product={product} />
        </div>

        {/* 右：分类眉标 / 状态 / 标题 / 标签 / 富文本 / 联系方式 */}
        <div>
          {category?.slug ? (
            <Link
              href={`/c/${category.slug}`}
              className="draw-underline mb-2 inline-block text-overline uppercase text-ink-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            >
              {category.name}
            </Link>
          ) : null}
          <StatusBadge
            availableToday={product.availableToday}
            availableTodayText={product.availableTodayText}
            statusText={product.statusText}
          />
          <div className="mt-3 flex items-start justify-between gap-4">
            <h1 className="font-display text-h1 font-semibold">{product.title}</h1>
            {/* 详情无外层 <Link>，收藏按钮可直接放置（开发计划 M7-8）。 */}
            <FavoriteButton
              productId={product.id}
              size={24}
              className="mt-1 h-11 w-11 shrink-0 rounded-full border border-line bg-paper"
            />
          </div>

          <TagRenderer tags={product.tags} className="mt-5" />

          {product.description ? (
            <RichText data={product.description} className="richtext mt-8 max-w-[68ch]" />
          ) : null}

          <ContactSection contacts={product.contacts} label={product.title} className="mt-10" />
        </div>
      </div>
    </div>
  );
}
