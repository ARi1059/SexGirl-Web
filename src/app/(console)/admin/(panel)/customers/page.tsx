import { getPayloadClient } from "@/lib/payload";
import { DataTable, trCls, tdCls } from "@/components/console/DataTable";
import { Pagination } from "@/components/console/Pagination";
import { PageHeader } from "@/components/console/PageHeader";
import { RowActions } from "@/components/console/RowActions";
import { formatDate } from "@/components/console/format";

export const dynamic = "force-dynamic";
const PER_PAGE = 20;

// 会员（前台客户）列表。客户自助注册，故无「新建」。删除需超管（服务端 access 强制，
// 非超管点删会收到 403 提示）；删除时其收藏由 Customers.beforeDelete 钩子级联清理。
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const payload = await getPayloadClient();
  const { docs, totalDocs, totalPages } = await payload.find({
    collection: "customers",
    sort: "-createdAt",
    page,
    limit: PER_PAGE,
    depth: 0,
  });

  return (
    <div className="p-7">
      <PageHeader title="客户管理" subtitle={`共 ${totalDocs} 位会员`} />
      <DataTable
        columns={["用户名", "昵称", "注册时间", "操作"]}
        rows={docs}
        empty="暂无会员"
        renderRow={(c) => (
          <tr key={c.id} className={trCls}>
            <td className={`${tdCls} font-medium text-ink`}>{c.username}</td>
            <td className={`${tdCls} text-ink-muted`}>{c.nickname || "—"}</td>
            <td className={`${tdCls} whitespace-nowrap text-ink-subtle`}>{formatDate(c.createdAt)}</td>
            <td className={tdCls}>
              <RowActions collection="customers" id={c.id} title={c.username} />
            </td>
          </tr>
        )}
        footer={
          <Pagination
            basePath="/admin/customers"
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
