import { getPayloadClient } from "@/lib/payload";
import { DataTable, trCls, tdCls } from "@/components/console/DataTable";
import { Pagination } from "@/components/console/Pagination";
import { PageHeader } from "@/components/console/PageHeader";
import { RowActions } from "@/components/console/RowActions";

export const dynamic = "force-dynamic";
const PER_PAGE = 20;

// 商品分类列表。编辑/新建深链 Payload /cms；前台查看链到 /c/<slug>。
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const payload = await getPayloadClient();
  const { docs, totalDocs, totalPages } = await payload.find({
    collection: "categories",
    sort: "-sortOrder",
    page,
    limit: PER_PAGE,
    depth: 0,
  });

  return (
    <div className="p-7">
      <PageHeader
        title="商品分类"
        subtitle={`共 ${totalDocs} 个分类`}
        createHref="/cms/collections/categories/create"
        createLabel="新建分类"
      />
      <DataTable
        columns={["类型名", "URL 标识", "排序", "操作"]}
        rows={docs}
        empty="暂无分类"
        renderRow={(c) => (
          <tr key={c.id} className={trCls}>
            <td className={`${tdCls} font-medium text-ink`}>{c.name}</td>
            <td className={tdCls}>
              <code className="rounded bg-surface px-1.5 py-0.5 text-[12px] text-ink-muted">
                {c.slug}
              </code>
            </td>
            <td className={`${tdCls} text-ink-muted`}>{c.sortOrder ?? 0}</td>
            <td className={tdCls}>
              <RowActions
                collection="categories"
                id={c.id}
                title={c.name}
                viewHref={c.slug ? `/c/${c.slug}` : undefined}
              />
            </td>
          </tr>
        )}
        footer={
          <Pagination
            basePath="/admin/categories"
            page={page}
            totalPages={totalPages}
            totalDocs={totalDocs}
            perPage={PER_PAGE}
          />
        }
      />
    </div>
  );
}
