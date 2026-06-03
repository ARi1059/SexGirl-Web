import { getPublishedProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { Gallery } from "@/components/gallery/Gallery";
import { CategoryNav } from "@/components/category/CategoryNav";
import { getSiteSettings } from "@/lib/site";

// 画廊列表页 /（开发计划 M3-2）。Server Component 经 Local API 读已上架商品（按 sortOrder 倒序）。
// ISR：静态缓存，配合 Payload afterChange hook 的 revalidatePath('/') 秒级生效（§7.3）。
export const revalidate = 3600;

export default async function GalleryPage() {
  const [products, categories, s] = await Promise.all([
    getPublishedProducts(),
    getCategories(),
    getSiteSettings(),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(20px,5vw,96px)] py-[clamp(48px,8vw,120px)]">
      {/* 分类导航条（开发计划 M6-5）：全部 / 今日可接单 / 各商品类型 */}
      <CategoryNav categories={categories} className="mb-[clamp(28px,4vw,52px)]" />

      {/* 区块标题 top-rule（设计规范 §6.5）：重规则线 + 左大标题 / 右眉标计数 */}
      <header className="mb-[clamp(32px,5vw,64px)] border-t-[1.5px] border-line-strong pt-6">
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-display text-display-l font-semibold">{s.galleryTitle}</h1>
          <p className="shrink-0 text-overline uppercase text-ink-muted">
            {products.length} {s.galleryUnit} · {s.galleryTagSuffix}
          </p>
        </div>
      </header>

      <Gallery products={products} />
    </div>
  );
}
