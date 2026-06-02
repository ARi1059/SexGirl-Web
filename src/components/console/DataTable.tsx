import type { ReactNode } from "react";

// 集合列表通用表格外壳（server，泛型）。统一卡片边框 / 表头样式 / 横向滚动 / 空态，
// 各页只管列名与每行的渲染（renderRow 返回 <tr>，自带 key）。footer 槽放分页。
export function DataTable<T>({
  columns,
  rows,
  renderRow,
  empty = "暂无数据",
  footer,
}: {
  columns: string[];
  rows: T[];
  renderRow: (row: T) => ReactNode;
  empty?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface text-left">
              {columns.map((c) => (
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
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-small text-ink-subtle"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

// 行/单元的共享类名（各列表页 renderRow 复用，保证一致）。
export const trCls = "border-b border-line transition-colors last:border-0 hover:bg-surface";
export const tdCls = "px-4 py-3 text-small";
