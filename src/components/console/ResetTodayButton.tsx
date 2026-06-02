"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * 「今日接单」批量重置（自建后台版）。打现成端点 POST /api/reset-available-today
 * （cookie 鉴权，服务端 isAdmin 强制）。不同于 components/admin 版用 @payloadcms/ui，
 * 此处用普通按钮 + 行内反馈，适配自建后台（无 Payload UI Provider）。
 * 成功后 router.refresh() 让仪表盘统计与列表随之更新。
 */
export function ResetTodayButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    if (!window.confirm("确定把所有商品的「今日接单」清零？此操作不可撤销。")) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/reset-available-today", {
        method: "POST",
        credentials: "include",
      });
      const data: { updated?: number; failed?: number; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? `重置失败（${res.status}）`);
        return;
      }
      const updated = data.updated ?? 0;
      setMsg(updated > 0 ? `已重置 ${updated} 个商品` : "没有需要重置的商品");
      router.refresh();
    } catch {
      setMsg("网络错误，重置失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-4 py-2.5 text-small font-medium text-ink-muted transition-colors hover:bg-surface disabled:opacity-60"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        {loading ? "重置中…" : "重置今日接单"}
      </button>
      {msg ? <span className="text-small text-ink-subtle">{msg}</span> : null}
    </div>
  );
}
