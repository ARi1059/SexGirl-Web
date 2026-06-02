"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 商品行内「上架 / 今日接单」可点切换（client）。乐观更新 + PATCH /api/products/:id；
// 失败回滚。成功后 router.refresh() 同步仪表盘统计等服务端数据。
// cookie 鉴权（credentials:include），服务端 isAdmin 强制 —— UI 不绕过权限。

const ON_GREEN = "rounded-full bg-[#6E9E62]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#5d8a52]";
const ON_ROSE = "rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-strong";
const OFF = "rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-medium text-ink-subtle";

export function ProductStatusToggles({
  id,
  published,
  availableToday,
}: {
  id: number;
  published: boolean;
  availableToday: boolean;
}) {
  const router = useRouter();
  const [pub, setPub] = useState(published);
  const [today, setToday] = useState(availableToday);
  const [busy, setBusy] = useState(false);

  async function patch(
    field: "published" | "availableToday",
    value: boolean,
    set: (v: boolean) => void,
    prev: boolean,
  ) {
    if (busy) return;
    setBusy(true);
    set(value); // 乐观
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      set(prev); // 回滚
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        disabled={busy}
        title="点击切换上架状态"
        onClick={() => patch("published", !pub, setPub, pub)}
        className={`${pub ? ON_GREEN : OFF} transition-opacity disabled:opacity-50`}
      >
        {pub ? "已上架" : "草稿"}
      </button>
      <button
        type="button"
        disabled={busy}
        title="点击切换今日接单"
        onClick={() => patch("availableToday", !today, setToday, today)}
        className={`${today ? ON_ROSE : OFF} transition-opacity disabled:opacity-50`}
      >
        {today ? "今日接单" : "今日"}
      </button>
    </div>
  );
}
