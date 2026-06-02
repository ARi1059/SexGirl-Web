import Link from "next/link";
import { Plus } from "lucide-react";

// 列表页通用页头：标题 + 计数副标题 + 可选「新建」按钮（深链 Payload 创建页）。
export function PageHeader({
  title,
  subtitle,
  createHref,
  createLabel = "新建",
}: {
  title: string;
  subtitle?: string;
  createHref?: string;
  createLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-small text-ink-subtle">{subtitle}</p> : null}
      </div>
      {createHref ? (
        <Link
          href={createHref}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-small font-medium text-on-accent transition-colors hover:bg-accent-strong"
        >
          <Plus size={14} /> {createLabel}
        </Link>
      ) : null}
    </div>
  );
}
