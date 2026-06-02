import Link from "next/link";
import { Search } from "lucide-react";
import { getPayloadClient } from "@/lib/payload";
import type { Where } from "payload";
import { Thumb } from "@/components/console/Thumb";
import { ProductStatusToggles } from "@/components/console/ProductStatusToggles";
import { RowActions } from "@/components/console/RowActions";
import { Pagination } from "@/components/console/Pagination";
import { PageHeader } from "@/components/console/PageHeader";
import { formatDate } from "@/components/console/format";

export const dynamic = "force-dynamic";
const PER_PAGE = 10;

// 商品列表 /admin/products（server，读异步 searchParams 的 q/page）。
// 列表数据走 Local API（门内，已 requireAdmin）；行内切上架/今日接单与删除走 REST（client）。
// 新建/编辑走自建内联表单 /admin/products/new|[id]（富文本/标签/封面多图上传均在站内处理）。
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const payload = await getPayloadClient();
  const where: Where = q ? { title: { contains: q } } : {};
  const { docs, totalDocs, totalPages } = await payload.find({
    collection: "products",
    where,
    sort: "-sortOrder",
    page,
    limit: PER_PAGE,
    depth: 1,
  });

  const cols = ["封面", "商品名称", "分类", "状态", "排序", "更新时间", "操作"];

  return (
    <div className="p-7">
      <PageHeader
        title="商品管理"
        subtitle={`共 ${totalDocs} 件商品`}
        createHref="/admin/products/new"
        createLabel="新建商品"
      />

      {/* 搜索（服务端驱动的 GET 表单，无需 JS）*/}
      <form className="mb-4 flex items-center gap-2.5" action="/admin/products" method="get">
        <div className="flex max-w-80 flex-1 items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
          <Search size={14} className="shrink-0 text-ink-subtle" />
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索商品标题…"
            className="w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-subtle"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-line bg-paper px-4 py-2 text-small text-ink-muted transition-colors hover:bg-surface"
        >
          搜索
        </button>
        {q ? (
          <Link href="/admin/products" className="text-small text-ink-subtle transition-colors hover:text-ink">
            清除
          </Link>
        ) : null}
      </form>

      {/* 表格 */}
      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface text-left">
                {cols.map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap border-b border-line px-4 py-2.5 text-[11px] font-medium tracking-wider text-ink-subtle"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="px-4 py-12 text-center text-small text-ink-subtle">
                    {q ? "未找到匹配商品" : "暂无商品"}
                  </td>
                </tr>
              ) : (
                docs.map((p) => {
                  const cat = typeof p.category === "object" && p.category ? p.category.name : null;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-line transition-colors last:border-0 hover:bg-surface"
                    >
                      <td className="px-4 py-3">
                        <Thumb value={p.coverImage} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[220px] truncate text-small font-medium text-ink">
                          {p.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-ink-subtle">#{p.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        {cat ? (
                          <span className="whitespace-nowrap rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px] text-ink-muted">
                            {cat}
                          </span>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ProductStatusToggles
                          id={p.id}
                          published={!!p.published}
                          availableToday={!!p.availableToday}
                        />
                      </td>
                      <td className="px-4 py-3 text-small text-ink-muted">{p.sortOrder ?? 0}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-small text-ink-subtle">
                        {formatDate(p.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <RowActions
                          collection="products"
                          id={p.id}
                          title={p.title}
                          viewHref={`/p/${p.id}`}
                          editHref={`/admin/products/${p.id}`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          basePath="/admin/products"
          page={page}
          totalPages={totalPages}
          totalDocs={totalDocs}
          perPage={PER_PAGE}
          query={{ q: q || undefined }}
        />
      </div>
    </div>
  );
}
