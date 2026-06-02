"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, SquarePen, Trash2 } from "lucide-react";

// 列表行操作（client，集合通用）。
// - 查看：前台链接（可选，新开标签）
// - 编辑：传 editHref → 站内软导航到自建编辑页（如 /admin/products/<id>）；否则深链 Payload /cms 编辑器
// - 删除：二次确认 → DELETE /api/<collection>/<id>（cookie 鉴权，服务端 isAdmin 强制；
//   级联清理由各集合的 beforeDelete 钩子负责）→ router.refresh()
export function RowActions({
  collection,
  id,
  title,
  viewHref,
  editHref,
}: {
  collection: string;
  id: number | string;
  title: string;
  viewHref?: string;
  editHref?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (busy) return;
    if (!window.confirm(`确定删除「${title}」？此操作不可撤销。`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/${collection}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.errors?.[0]?.message ?? `删除失败（${res.status}）`);
        return;
      }
      router.refresh();
    } catch {
      alert("网络错误，删除失败");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "grid size-7 place-items-center rounded-md border border-line text-ink-muted transition-colors hover:text-ink";

  return (
    <div className="flex items-center gap-1.5">
      {viewHref ? (
        <a
          href={viewHref}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          title="前台查看"
        >
          <Eye size={13} />
        </a>
      ) : null}
      {editHref ? (
        <Link href={editHref} className={btn} title="编辑">
          <SquarePen size={13} />
        </Link>
      ) : (
        <a href={`/cms/collections/${collection}/${id}`} className={btn} title="编辑（Payload 编辑器）">
          <SquarePen size={13} />
        </a>
      )}
      <button
        type="button"
        onClick={del}
        disabled={busy}
        title="删除"
        className="grid size-7 place-items-center rounded-md border border-accent-soft text-accent-strong transition-colors hover:bg-accent-soft disabled:opacity-50"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
