import { getCategories } from "@/lib/categories";
import { getContacts } from "@/lib/contacts";
import { ProductForm } from "@/components/console/product-form/ProductForm";
import { emptyInitial } from "@/components/console/product-form/types";

export const dynamic = "force-dynamic";

// 新建商品 /admin/products/new（server）。读分类/客服作为选项，渲染空白内联表单。
export default async function NewProductPage() {
  const [categories, contacts] = await Promise.all([getCategories(), getContacts()]);
  return (
    <ProductForm mode="create" initial={emptyInitial()} categories={categories} contacts={contacts} />
  );
}
