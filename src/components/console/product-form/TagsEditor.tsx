"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/payload-types";
import { ICON_NAMES } from "@/lib/icons";
import { FieldLabel, SelectField, TextField } from "./fields";

// 标签块编辑器（文字/图标/色块/链接）。本地编辑态用判别联合 + 临时 key（不提交）。
// 与 Payload blocks 格式互转见 tagsToEdit / editToTags（供 ProductForm 回填与提交复用）。

type TagBlock = NonNullable<NonNullable<Product["tags"]>[number]>;
type TagStyle = { color?: string; bg?: string };

export type EditTag =
  | { key: string; blockType: "text"; label: string; style?: TagStyle }
  | { key: string; blockType: "icon"; label: string; icon: string }
  | { key: string; blockType: "colorBlock"; label: string; bg: string }
  | { key: string; blockType: "link"; label: string; url: string };

const TYPE_LABEL: Record<EditTag["blockType"], string> = {
  text: "文字标签",
  icon: "图标标签",
  colorBlock: "色块标签",
  link: "链接标签",
};

const newKey = (): string => crypto.randomUUID();

function parseStyle(style: unknown): TagStyle {
  if (style && typeof style === "object" && !Array.isArray(style)) {
    const s = style as Record<string, unknown>;
    return {
      color: typeof s.color === "string" ? s.color : undefined,
      bg: typeof s.bg === "string" ? s.bg : undefined,
    };
  }
  return {};
}

/** Payload tags → 本地编辑态（回填）。未知类型跳过。 */
export function tagsToEdit(tags: Product["tags"]): EditTag[] {
  if (!tags) return [];
  return tags.flatMap((t): EditTag[] => {
    const key = newKey();
    switch (t.blockType) {
      case "text":
        return [{ key, blockType: "text", label: t.label, style: parseStyle(t.style) }];
      case "icon":
        return [{ key, blockType: "icon", label: t.label, icon: t.icon }];
      case "colorBlock":
        return [{ key, blockType: "colorBlock", label: t.label, bg: parseStyle(t.style).bg ?? "#C96A72" }];
      case "link":
        return [{ key, blockType: "link", label: t.label, url: t.url }];
      default:
        return [];
    }
  });
}

/** 本地编辑态 → Payload tags（提交）。去掉临时 key，组装 style。 */
export function editToTags(edit: EditTag[]): TagBlock[] {
  return edit.map((t): TagBlock => {
    switch (t.blockType) {
      case "text":
        return t.style && (t.style.color || t.style.bg)
          ? { blockType: "text", label: t.label, style: t.style }
          : { blockType: "text", label: t.label };
      case "icon":
        return { blockType: "icon", label: t.label, icon: t.icon };
      case "colorBlock":
        return { blockType: "colorBlock", label: t.label, style: { bg: t.bg } };
      case "link":
        return { blockType: "link", label: t.label, url: t.url };
    }
  });
}

function makeTag(type: EditTag["blockType"]): EditTag {
  const key = newKey();
  switch (type) {
    case "text":
      return { key, blockType: "text", label: "" };
    case "icon":
      return { key, blockType: "icon", label: "", icon: ICON_NAMES[0] };
    case "colorBlock":
      return { key, blockType: "colorBlock", label: "", bg: "#C96A72" };
    case "link":
      return { key, blockType: "link", label: "", url: "" };
  }
}

export function TagsEditor({
  value,
  onChange,
}: {
  value: EditTag[];
  onChange: (v: EditTag[]) => void;
}) {
  const [adding, setAdding] = useState(false);

  const update = (key: string, patch: Record<string, unknown>) =>
    onChange(value.map((t) => (t.key === key ? ({ ...t, ...patch } as EditTag) : t)));

  const remove = (key: string) => onChange(value.filter((t) => t.key !== key));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const iconOptions = ICON_NAMES.map((n) => ({ label: n, value: n }));

  return (
    <div>
      <FieldLabel label="标签" desc="自由排列；前台据 blockType 配置渲染" />
      <div className="flex flex-col gap-2">
        {value.map((t, i) => (
          <div key={t.key} className="overflow-hidden rounded border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line bg-panel px-3 py-2">
              <span className="flex-1 text-[12.5px] font-medium text-ink-muted">
                {TYPE_LABEL[t.blockType]}
              </span>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="上移"
                className="grid size-6 place-items-center rounded text-ink-subtle transition-colors hover:text-ink disabled:opacity-30"
              >
                <ChevronUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label="下移"
                className="grid size-6 place-items-center rounded text-ink-subtle transition-colors hover:text-ink disabled:opacity-30"
              >
                <ChevronDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => remove(t.key)}
                aria-label="删除标签"
                className="grid size-6 place-items-center rounded text-ink-subtle transition-colors hover:text-accent-strong"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="space-y-3 p-3">
              <TextField
                label="标签文字"
                required
                value={t.label}
                onChange={(v) => update(t.key, { label: v })}
              />
              {t.blockType === "icon" ? (
                <SelectField
                  label="图标"
                  value={t.icon}
                  onChange={(v) => update(t.key, { icon: v })}
                  options={iconOptions}
                />
              ) : null}
              {t.blockType === "colorBlock" ? (
                <div>
                  <FieldLabel label="色块颜色" required />
                  <input
                    type="color"
                    value={t.bg}
                    onChange={(e) => update(t.key, { bg: e.target.value })}
                    aria-label="色块颜色"
                    className="h-9 w-16 cursor-pointer rounded border border-line bg-surface p-1"
                  />
                </div>
              ) : null}
              {t.blockType === "link" ? (
                <TextField
                  label="链接地址"
                  required
                  placeholder="https://"
                  value={t.url}
                  onChange={(v) => update(t.key, { url: v })}
                />
              ) : null}
            </div>
          </div>
        ))}

        {adding ? (
          <div className="flex flex-wrap gap-2 rounded border border-line bg-surface p-3">
            {(Object.keys(TYPE_LABEL) as EditTag["blockType"][]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onChange([...value, makeTag(type)]);
                  setAdding(false);
                }}
                className="rounded border border-line bg-panel px-3.5 py-1.5 text-[12.5px] text-ink transition-colors hover:border-accent"
              >
                {TYPE_LABEL[type]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded border border-line px-2.5 py-1.5 text-xs text-ink-subtle transition-colors hover:text-ink"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded border-[1.5px] border-dashed border-line px-3.5 py-2.5 text-[13px] text-ink-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Plus size={14} />
            添加标签块
          </button>
        )}
      </div>
    </div>
  );
}
