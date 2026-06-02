import { getPayloadClient } from "@/lib/payload";
import { DataTable, trCls, tdCls } from "@/components/console/DataTable";
import { Pagination } from "@/components/console/Pagination";
import { PageHeader } from "@/components/console/PageHeader";
import { RowActions } from "@/components/console/RowActions";
import { Thumb } from "@/components/console/Thumb";
import { formatDate } from "@/components/console/format";

export const dynamic = "force-dynamic";
const PER_PAGE = 24;

// 媒体库列表（概览）。上传/替换走 Payload /cms（sharp 多尺寸、S3 直传在那里）。
// 删除经 REST DELETE；被商品引用的图删除可能受约束，错误会由 RowActions 提示。
export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const payload = await getPayloadClient();
  const { docs, totalDocs, totalPages } = await payload.find({
    collection: "media",
    sort: "-createdAt",
    page,
    limit: PER_PAGE,
    depth: 0,
  });

  return (
    <div className="p-7">
      <PageHeader
        title="媒体库"
        subtitle={`共 ${totalDocs} 张图片`}
        createHref="/cms/collections/media/create"
        createLabel="上传图片"
      />
      <DataTable
        columns={["预览", "文件名 / 替代文字", "尺寸", "上传时间", "操作"]}
        rows={docs}
        empty="媒体库为空"
        renderRow={(m) => (
          <tr key={m.id} className={trCls}>
            <td className={tdCls}>
              <Thumb value={m} />
            </td>
            <td className={tdCls}>
              <div className="max-w-[260px] truncate font-medium text-ink">{m.filename || `#${m.id}`}</div>
              {m.alt ? <div className="mt-0.5 truncate text-[11px] text-ink-subtle">{m.alt}</div> : null}
            </td>
            <td className={`${tdCls} whitespace-nowrap text-ink-muted`}>
              {m.width && m.height ? `${m.width}×${m.height}` : "—"}
            </td>
            <td className={`${tdCls} whitespace-nowrap text-ink-subtle`}>{formatDate(m.createdAt)}</td>
            <td className={tdCls}>
              <RowActions collection="media" id={m.id} title={m.filename || `图片 #${m.id}`} />
            </td>
          </tr>
        )}
        footer={
          <Pagination
            basePath="/admin/media"
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
