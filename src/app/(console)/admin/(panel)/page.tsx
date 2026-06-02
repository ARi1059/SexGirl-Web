import Link from "next/link";
import { Package, ShoppingBag, TrendingUp, Users, Plus, ArrowRight } from "lucide-react";
import { getPayloadClient } from "@/lib/payload";
import { StatCards, type Stat } from "@/components/console/StatCards";
import { ResetTodayButton } from "@/components/console/ResetTodayButton";
import { PublishedPill, TodayPill } from "@/components/console/StatusPills";
import { Thumb } from "@/components/console/Thumb";
import { formatDate } from "@/components/console/format";
import type { Product } from "@/payload-types";

// 后台实时数据，不做静态缓存。
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const payload = await getPayloadClient();

  // 统计取数失败时（如 DB 抖动）降级为只显示标题与快捷操作，不让整页崩（同 admin/DashboardStats）。
  let stats: Stat[] | null = null;
  let recent: Product[] = [];
  try {
    const [total, published, today, customers] = await Promise.all([
      payload.count({ collection: "products" }),
      payload.count({ collection: "products", where: { published: { equals: true } } }),
      payload.count({ collection: "products", where: { availableToday: { equals: true } } }),
      payload.count({ collection: "customers" }),
    ]);
    stats = [
      { label: "商品总数", value: total.totalDocs, icon: Package, color: "#C96A72" },
      { label: "已上架", value: published.totalDocs, icon: ShoppingBag, color: "#5B8FA8" },
      { label: "今日可接单", value: today.totalDocs, icon: TrendingUp, color: "#7A9E6E" },
      { label: "会员数", value: customers.totalDocs, icon: Users, color: "#9B7EC0" },
    ];
    const r = await payload.find({ collection: "products", sort: "-updatedAt", limit: 5, depth: 1 });
    recent = r.docs;
  } catch {
    stats = null;
  }

  const dateLabel = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="p-7">
      {/* 欢迎 */}
      <div className="mb-7">
        <h1 className="font-display text-[26px] font-semibold tracking-[0.01em] text-ink">
          定制商品 · 管理后台
        </h1>
        <p className="mt-1.5 text-small text-ink-subtle">{dateLabel} · 欢迎回来</p>
      </div>

      {/* 统计 */}
      {stats ? (
        <StatCards stats={stats} />
      ) : (
        <p className="text-small text-ink-subtle">统计数据暂不可用</p>
      )}

      {/* 快捷操作 */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <Link
          href="/cms/collections/products/create"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-small font-medium text-on-accent transition-colors hover:bg-accent-strong"
        >
          <Plus size={14} /> 新建商品
        </Link>
        <ResetTodayButton />
      </div>

      {/* 最近商品 */}
      <div className="mt-7 overflow-hidden rounded-xl border border-line bg-paper">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="font-display text-[15px] font-semibold text-ink">最近商品</span>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-small font-medium text-accent transition-colors hover:text-accent-strong"
          >
            查看全部 <ArrowRight size={12} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-small text-ink-subtle">暂无商品</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface text-left">
                  {["封面", "商品名称", "分类", "状态", "更新时间"].map((c) => (
                    <th
                      key={c}
                      className="whitespace-nowrap border-b border-line px-5 py-2.5 text-[11.5px] font-medium tracking-wider text-ink-subtle"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => {
                  const cat =
                    typeof p.category === "object" && p.category ? p.category.name : null;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-line transition-colors last:border-0 hover:bg-surface"
                    >
                      <td className="px-5 py-3">
                        <Thumb value={p.coverImage} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-small font-medium text-ink">{p.title}</div>
                        <div className="mt-0.5 text-[11px] text-ink-subtle">#{p.id}</div>
                      </td>
                      <td className="px-5 py-3">
                        {cat ? (
                          <span className="whitespace-nowrap rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px] text-ink-muted">
                            {cat}
                          </span>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <PublishedPill on={!!p.published} />
                          {p.availableToday ? <TodayPill /> : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-small text-ink-subtle">
                        {formatDate(p.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
