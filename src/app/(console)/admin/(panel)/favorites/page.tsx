import { getPayloadClient } from "@/lib/payload";
import { DataTable, trCls, tdCls } from "@/components/console/DataTable";
import { Pagination } from "@/components/console/Pagination";
import { PageHeader } from "@/components/console/PageHeader";
import { formatDate } from "@/components/console/format";

export const dynamic = "force-dynamic";
const PER_PAGE = 30;

// 用户收藏（只读概览）。收藏只由客户本人增删（Favorites.access：update:false、
// delete 仅客户本人），管理员不可改 —— 故本列表不提供操作列。depth:1 展开会员/商品名。
export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const payload = await getPayloadClient();
  const { docs, totalDocs, totalPages } = await payload.find({
    collection: "favorites",
    sort: "-createdAt",
    page,
    limit: PER_PAGE,
    depth: 1,
  });

  return (
    <div className="p-7">
      <PageHeader title="用户收藏" subtitle={`共 ${totalDocs} 条收藏`} />
      <DataTable
        columns={["会员", "商品", "收藏时间"]}
        rows={docs}
        empty="暂无收藏记录"
        renderRow={(f) => {
          const customer =
            typeof f.customer === "object" && f.customer
              ? f.customer.username
              : `#${f.customer}`;
          const product =
            typeof f.product === "object" && f.product ? f.product.title : `#${f.product}`;
          return (
            <tr key={f.id} className={trCls}>
              <td className={`${tdCls} font-medium text-ink`}>{customer}</td>
              <td className={`${tdCls} text-ink-muted`}>{product}</td>
              <td className={`${tdCls} whitespace-nowrap text-ink-subtle`}>
                {formatDate(f.createdAt)}
              </td>
            </tr>
          );
        }}
        footer={
          <Pagination
            basePath="/admin/favorites"
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
