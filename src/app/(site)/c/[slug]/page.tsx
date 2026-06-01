import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Product } from "@/payload-types";
import {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
  getAvailableTodayProducts,
} from "@/lib/categories";
import { Gallery } from "@/components/gallery/Gallery";
import { CategoryNav } from "@/components/category/CategoryNav";

// 分类页 /c/[slug]（开发计划 M6-6/M6-7）。商品类型分类页 + 今日可接单虚拟分类页同一路由。
// ISR：与列表/详情同样静态缓存，配合分类/商品 afterChange 的 revalidatePath 秒级生效（§7.4）。
export const revalidate = 3600;

const DEFAULT_TODAY = "今日可接单";

// today 为保留 slug 的虚拟分类（开发文档 §7.2），其余 slug 取自 categories 集合。
export async function generateStaticParams() {
  const categories = await getCategories();
  return [
    { slug: "today" },
    ...categories.filter((c) => c.slug).map((c) => ({ slug: c.slug as string })),
  ];
}

type Resolved = { title: string; subtitle: string; products: Product[] };

// 解析 slug → 页标题 + 商品集合。today 走 availableToday 过滤、标题取自定义文案；
// 普通分类按 slug 命中 categories 再取该分类商品；未知 slug 返回 null（→ notFound）。
async function resolve(slug: string): Promise<Resolved | null> {
  if (slug === "today") {
    const products = await getAvailableTodayProducts();
    const title =
      products.find((p) => p.availableTodayText?.trim())?.availableTodayText?.trim() ||
      DEFAULT_TODAY;
    return { title, subtitle: "今日可接单", products };
  }
  const category = await getCategoryBySlug(slug);
  if (!category) return null;
  const products = await getProductsByCategory(category.id);
  return { title: category.name, subtitle: "商品类型", products };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await resolve(slug);
  if (!data) return { title: "未找到 · 定制商品展示" };
  return { title: `${data.title} · 定制商品展示` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // Next 16：params 为异步
  const [data, categories] = await Promise.all([resolve(slug), getCategories()]);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(20px,5vw,96px)] py-[clamp(48px,8vw,120px)]">
      <CategoryNav categories={categories} className="mb-[clamp(28px,4vw,52px)]" />

      {/* 区块标题 top-rule（设计规范 §6.5），与列表页同构 */}
      <header className="mb-[clamp(32px,5vw,64px)] border-t-[1.5px] border-line-strong pt-6">
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-display text-display-l font-semibold">{data.title}</h1>
          <p className="shrink-0 text-overline uppercase text-ink-muted">
            {data.products.length} 款 · {data.subtitle}
          </p>
        </div>
      </header>

      <Gallery products={data.products} />
    </div>
  );
}
