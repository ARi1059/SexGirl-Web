import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 列表分页（server，Link 驱动；保留搜索等查询参数）。各集合列表共用。
// page=1 时省略 page 参数（保持 URL 干净）。

function buildHref(
  basePath: string,
  page: number,
  query: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  page,
  totalPages,
  totalDocs,
  perPage,
  query = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  totalDocs: number;
  perPage: number;
  query?: Record<string, string | undefined>;
}) {
  const cell =
    "grid size-8 place-items-center rounded-md border border-line text-small transition-colors";

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between border-t border-line bg-surface px-5 py-3 text-small text-ink-subtle">
        <span>共 {totalDocs} 条</span>
      </div>
    );
  }

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalDocs);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3">
      <span className="text-small text-ink-subtle">
        第 {from}–{to} 条，共 {totalDocs} 条
      </span>
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link
            href={buildHref(basePath, page - 1, query)}
            className={`${cell} text-ink-muted hover:bg-panel`}
            aria-label="上一页"
          >
            <ChevronLeft size={13} />
          </Link>
        ) : (
          <span className={`${cell} text-ink-subtle opacity-40`}>
            <ChevronLeft size={13} />
          </span>
        )}
        {pages.map((n) =>
          n === page ? (
            <span
              key={n}
              aria-current="page"
              className={`${cell} border-transparent bg-accent font-semibold text-on-accent`}
            >
              {n}
            </span>
          ) : (
            <Link
              key={n}
              href={buildHref(basePath, n, query)}
              className={`${cell} text-ink-muted hover:bg-panel`}
            >
              {n}
            </Link>
          ),
        )}
        {page < totalPages ? (
          <Link
            href={buildHref(basePath, page + 1, query)}
            className={`${cell} text-ink-muted hover:bg-panel`}
            aria-label="下一页"
          >
            <ChevronRight size={13} />
          </Link>
        ) : (
          <span className={`${cell} text-ink-subtle opacity-40`}>
            <ChevronRight size={13} />
          </span>
        )}
      </div>
    </div>
  );
}
