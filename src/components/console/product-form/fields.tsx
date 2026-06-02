"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 商品表单的通用受控控件 —— 把设计原型反复出现的输入/标签/开关/下拉/卡片
// 从内联 style 移植成 Tailwind 语义 class（token 随 .dark 切换）。集中复用，避免各子组件重写样式。

const inputBase =
  "w-full rounded border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-accent focus:ring-2 focus:ring-accent-soft";

export function FieldLabel({
  label,
  required,
  desc,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  desc?: string;
  htmlFor?: string;
}) {
  return (
    <div className="mb-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted"
      >
        {label}
        {required ? <span className="text-accent">*</span> : null}
      </label>
      {desc ? <p className="mt-1 text-[11.5px] leading-relaxed text-ink-subtle">{desc}</p> : null}
    </div>
  );
}

export function TextField({
  label,
  required,
  desc,
  placeholder,
  value,
  onChange,
  type = "text",
  inputMode,
  error,
  id,
}: {
  label: string;
  required?: boolean;
  desc?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "text" | "numeric";
  error?: string;
  id?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} desc={desc} htmlFor={id} />
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={cn(inputBase, error && "border-accent-strong focus:border-accent-strong")}
      />
      {error ? <p className="mt-1 text-[11.5px] text-accent-strong">{error}</p> : null}
    </div>
  );
}

export function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-3.5 last:border-0">
      <div>
        <div className="text-[13.5px] font-medium text-ink">{label}</div>
        {desc ? <div className="mt-0.5 text-[11.5px] text-ink-subtle">{desc}</div> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[22px] w-10 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all",
            checked ? "left-[21px]" : "left-[3px]",
          )}
        />
      </button>
    </div>
  );
}

export function SelectField({
  label,
  desc,
  options,
  value,
  onChange,
  id,
}: {
  label: string;
  desc?: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} desc={desc} htmlFor={id} />
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputBase, "cursor-pointer appearance-none pr-9")}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle"
        />
      </div>
    </div>
  );
}

/** 侧栏分组卡片：panel 头 + paper 体（发布设置 / 商品信息 / 绑定客服）。 */
export function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-paper">
      <div className="border-b border-line bg-panel px-4 py-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** 主列内容块容器（标题 / 封面 / 多图 / 描述 / 标签）。 */
export function FormCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-md border border-line bg-paper p-5", className)}>{children}</div>;
}
