"use client";

import { X } from "lucide-react";
import type { Contact } from "@/payload-types";

const CONTACT_TYPE: Record<Contact["type"], string> = {
  wechat: "微信号",
  wechatQr: "微信二维码",
  qq: "QQ 号",
  qqQr: "QQ 二维码",
};

/** 客服显示名：自定义显示名优先，否则回退类型中文名。 */
export function contactName(c: Contact): string {
  return c.label?.trim() || CONTACT_TYPE[c.type];
}

// 绑定客服：已选列表（圆点 + 名 + 删除）+ 从未选客服里添加（下拉）。提交时取 id 数组。
export function ContactsPicker({
  all,
  value,
  onChange,
}: {
  all: Contact[];
  value: Contact[];
  onChange: (v: Contact[]) => void;
}) {
  const available = all.filter((c) => !value.some((v) => v.id === c.id));

  function add(idStr: string) {
    const c = all.find((x) => String(x.id) === idStr);
    if (c) onChange([...value, c]);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-2 rounded border border-line bg-surface px-2.5 py-2"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-accent" />
          <span className="flex-1 truncate text-[13px] text-ink">{contactName(c)}</span>
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v.id !== c.id))}
            aria-label={`移除 ${contactName(c)}`}
            className="grid place-items-center text-ink-subtle transition-colors hover:text-ink"
          >
            <X size={13} />
          </button>
        </div>
      ))}

      {available.length > 0 ? (
        <select
          value=""
          onChange={(e) => {
            add(e.target.value);
            e.target.value = "";
          }}
          className="cursor-pointer rounded border-[1.5px] border-dashed border-line bg-transparent px-2.5 py-2 text-[12.5px] text-ink-muted outline-none transition-colors hover:border-accent focus:border-accent"
        >
          <option value="">+ 添加客服…</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {contactName(c)}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-[11.5px] text-ink-subtle">
          {all.length === 0 ? "暂无客服，请先在「客服联系」新建。" : "已绑定全部客服。"}
        </p>
      )}
    </div>
  );
}
