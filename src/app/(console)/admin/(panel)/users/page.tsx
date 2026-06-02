import { getPayloadClient } from "@/lib/payload";
import { DataTable, trCls, tdCls } from "@/components/console/DataTable";
import { Pagination } from "@/components/console/Pagination";
import { PageHeader } from "@/components/console/PageHeader";
import { RowActions } from "@/components/console/RowActions";

export const dynamic = "force-dynamic";
const PER_PAGE = 20;

const ROLE_LABEL: Record<string, string> = { admin: "管理员", superadmin: "超级管理员" };

// 管理员账号列表。新建/删除需超管（服务端 access 强制，非超管操作会收到 403 提示）。
// 编辑深链 Payload /cms（改密码 / 角色等）。
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const payload = await getPayloadClient();
  const { docs, totalDocs, totalPages } = await payload.find({
    collection: "users",
    sort: "-createdAt",
    page,
    limit: PER_PAGE,
    depth: 0,
  });

  return (
    <div className="p-7">
      <PageHeader
        title="管理员"
        subtitle={`共 ${totalDocs} 个账号`}
        createHref="/cms/collections/users/create"
        createLabel="新建管理员"
      />
      <DataTable
        columns={["姓名", "邮箱", "角色", "操作"]}
        rows={docs}
        empty="暂无管理员"
        renderRow={(u) => (
          <tr key={u.id} className={trCls}>
            <td className={`${tdCls} font-medium text-ink`}>{u.name || "—"}</td>
            <td className={`${tdCls} text-ink-muted`}>{u.email}</td>
            <td className={tdCls}>
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ${
                  u.role === "superadmin"
                    ? "bg-accent-soft text-accent-strong"
                    : "border border-line bg-surface text-ink-muted"
                }`}
              >
                {ROLE_LABEL[u.role] ?? u.role}
              </span>
            </td>
            <td className={tdCls}>
              <RowActions collection="users" id={u.id} title={u.name || u.email} />
            </td>
          </tr>
        )}
        footer={
          <Pagination
            basePath="/admin/users"
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
