import { getPayloadClient } from "@/lib/payload";
import { DataTable, trCls, tdCls } from "@/components/console/DataTable";
import { Pagination } from "@/components/console/Pagination";
import { PageHeader } from "@/components/console/PageHeader";
import { RowActions } from "@/components/console/RowActions";
import { Thumb } from "@/components/console/Thumb";

export const dynamic = "force-dynamic";
const PER_PAGE = 20;

const TYPE_LABEL: Record<string, string> = {
  wechat: "微信号",
  wechatQr: "微信二维码",
  qq: "QQ 号",
  qqQr: "QQ 二维码",
};

// 客服联系方式列表。微信/QQ 号显示号码；二维码类型显示缩略图。编辑/新建深链 /cms。
export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const payload = await getPayloadClient();
  const { docs, totalDocs, totalPages } = await payload.find({
    collection: "contacts",
    sort: "-createdAt",
    page,
    limit: PER_PAGE,
    depth: 1,
  });

  const isQr = (t: string) => t === "wechatQr" || t === "qqQr";

  return (
    <div className="p-7">
      <PageHeader
        title="客服联系方式"
        subtitle={`共 ${totalDocs} 个客服`}
        createHref="/cms/collections/contacts/create"
        createLabel="新建客服"
      />
      <DataTable
        columns={["显示名", "类型", "号码 / 二维码", "操作"]}
        rows={docs}
        empty="暂无客服联系方式"
        renderRow={(c) => (
          <tr key={c.id} className={trCls}>
            <td className={`${tdCls} font-medium text-ink`}>{c.label || "—"}</td>
            <td className={`${tdCls} text-ink-muted`}>
              <span className="whitespace-nowrap rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px]">
                {TYPE_LABEL[c.type] ?? c.type}
              </span>
            </td>
            <td className={`${tdCls} text-ink-muted`}>
              {isQr(c.type) ? <Thumb value={c.qrImage} size={36} /> : c.value || "—"}
            </td>
            <td className={tdCls}>
              <RowActions collection="contacts" id={c.id} title={c.label || `客服 #${c.id}`} />
            </td>
          </tr>
        )}
        footer={
          <Pagination
            basePath="/admin/contacts"
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
