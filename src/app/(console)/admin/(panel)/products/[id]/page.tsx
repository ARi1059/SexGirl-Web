import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import { getCategories } from "@/lib/categories";
import { getContacts } from "@/lib/contacts";
import { resolveImage } from "@/lib/media";
import { isComplexLexical, lexicalToText } from "@/lib/lexical";
import { ProductForm } from "@/components/console/product-form/ProductForm";
import type { ProductFormInitial } from "@/components/console/product-form/types";
import type { Contact, Media } from "@/payload-types";

export const dynamic = "force-dynamic";

// 编辑商品 /admin/products/[id]（server）。findByID(depth:2) 展开封面/多图/分类/客服为对象，
// 映射成扁平 initial 传入内联表单。缺失 → notFound。静态段 new/ 优先，故不与新建页冲突。
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Next 16：params 为异步
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const payload = await getPayloadClient();
  let product;
  try {
    product = await payload.findByID({ collection: "products", id: numId, depth: 2 });
  } catch {
    notFound(); // findByID 对缺失会抛错
  }
  if (!product) notFound();

  const [categories, contacts] = await Promise.all([getCategories(), getContacts()]);

  const toImg = (m: Media) => ({ id: m.id, url: resolveImage(m, "thumbnail")?.url ?? m.url ?? "" });

  const cover = product.coverImage;
  const cat = product.category;

  const initial: ProductFormInitial = {
    title: product.title,
    descriptionText: lexicalToText(product.description),
    descriptionComplex: isComplexLexical(product.description),
    coverImage: cover && typeof cover === "object" ? toImg(cover) : null,
    images: (product.images ?? []).flatMap((it) =>
      it.image && typeof it.image === "object" ? [toImg(it.image)] : [],
    ),
    published: !!product.published,
    availableToday: !!product.availableToday,
    availableTodayText: product.availableTodayText ?? "今日可接单",
    statusText: product.statusText ?? "",
    price: product.price ?? "",
    categoryId: cat && typeof cat === "object" ? String(cat.id) : typeof cat === "number" ? String(cat) : "",
    sortOrder: String(product.sortOrder ?? 0),
    tags: product.tags ?? null,
    contacts: (product.contacts ?? []).filter((c): c is Contact => typeof c === "object" && c !== null),
  };

  return (
    <ProductForm
      mode="edit"
      productId={numId}
      initial={initial}
      categories={categories}
      contacts={contacts}
    />
  );
}
