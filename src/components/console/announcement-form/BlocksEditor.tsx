"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info, Plus, Trash2 } from "lucide-react";
import { ICON_NAMES } from "@/lib/icons";
import { SingleImageUpload } from "../product-form/SingleImageUpload";
import { FieldLabel, SelectField, TextField } from "../product-form/fields";
import { FileUpload } from "./FileUpload";
import { BLOCK_TYPE_LABEL, type EditBlock, type EditBlockType } from "./types";

// 公告积木编辑器（多态，仿 product-form/TagsEditor）。覆盖全部 7 种积木：
// 富文本/图片/按钮/图文步骤/二维码/提示框/下载按钮。每块「类型头 + 上下移 + 删除」，
// 底部「添加积木」7 类调色板。富文本字段用纯文本 textarea + complex 警示条（含 /cms 兜底）。

const textareaBase =
  "w-full resize-y rounded border border-line bg-surface px-3.5 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-accent focus:ring-2 focus:ring-accent-soft";

// 简化富文本控件：纯文本多段（每行一段）+ 含富格式时的压平警示。
function RichTextArea({
  label,
  value,
  onChange,
  complex,
  cmsHref,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  complex: boolean;
  cmsHref?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} />
      {complex ? (
        <div className="mb-2 flex items-start gap-2 rounded border border-accent-soft bg-accent-soft/50 px-3 py-2 text-[11.5px] leading-relaxed text-accent-strong">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            此段含富格式（标题/加粗/列表等），简化编辑器仅保留纯文字，保存将压平。如需保留请用{" "}
            {cmsHref ? (
              <a href={cmsHref} target="_blank" rel="noopener noreferrer" className="underline">
                CMS 编辑器
              </a>
            ) : (
              "CMS 编辑器"
            )}{" "}
            打开。
          </span>
        </div>
      ) : null}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="在此输入文字…"
        className={textareaBase}
      />
      <p className="mt-1.5 text-[11.5px] text-ink-subtle">每行将作为一个段落显示。</p>
    </div>
  );
}

const newKey = (): string => crypto.randomUUID();

function makeBlock(type: EditBlockType): EditBlock {
  const key = newKey();
  switch (type) {
    case "richText":
      return { key, blockType: "richText", text: "", complex: false };
    case "image":
      return { key, blockType: "image", image: null, caption: "" };
    case "button":
      return { key, blockType: "button", label: "", url: "", style: "primary", icon: "" };
    case "step":
      return { key, blockType: "step", title: "", bodyText: "", bodyComplex: false, image: null };
    case "qrcode":
      return { key, blockType: "qrcode", image: null, label: "", caption: "" };
    case "callout":
      return { key, blockType: "callout", tone: "info", text: "", complex: false };
    case "download":
      return { key, blockType: "download", file: null, label: "", platform: "other", version: "", note: "" };
  }
}

export function BlocksEditor({
  value,
  onChange,
  cmsHref,
}: {
  value: EditBlock[];
  onChange: (v: EditBlock[]) => void;
  cmsHref?: string;
}) {
  const [adding, setAdding] = useState(false);

  // patch 用宽松 Record + cast（同 TagsEditor）：SelectField 只会回合法字面量值。
  const update = (key: string, patch: Record<string, unknown>) =>
    onChange(value.map((b) => (b.key === key ? ({ ...b, ...patch } as EditBlock) : b)));

  const remove = (key: string) => onChange(value.filter((b) => b.key !== key));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const iconOptions = [
    { label: "（无图标）", value: "" },
    ...ICON_NAMES.map((n) => ({ label: n, value: n })),
  ];

  return (
    <div className="flex flex-col gap-3">
      {value.map((b, i) => (
        <div key={b.key} className="overflow-hidden rounded border border-line bg-surface">
          {/* 块头：类型名 + 上下移 + 删除 */}
          <div className="flex items-center gap-2 border-b border-line bg-panel px-3 py-2">
            <span className="flex-1 text-[12.5px] font-medium text-ink-muted">
              {BLOCK_TYPE_LABEL[b.blockType]}
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
              onClick={() => remove(b.key)}
              aria-label="删除积木"
              className="grid size-6 place-items-center rounded text-ink-subtle transition-colors hover:text-accent-strong"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* 块体：按类型渲染子表单 */}
          <div className="space-y-3 p-3.5">
            {b.blockType === "richText" ? (
              <RichTextArea
                label="正文"
                value={b.text}
                onChange={(v) => update(b.key, { text: v })}
                complex={b.complex}
                cmsHref={cmsHref}
              />
            ) : null}

            {b.blockType === "image" ? (
              <>
                <div>
                  <FieldLabel label="图片" required />
                  <SingleImageUpload value={b.image} onChange={(v) => update(b.key, { image: v })} />
                </div>
                <TextField label="图注（可选）" value={b.caption} onChange={(v) => update(b.key, { caption: v })} />
              </>
            ) : null}

            {b.blockType === "button" ? (
              <>
                <TextField label="按钮文字" required value={b.label} onChange={(v) => update(b.key, { label: v })} />
                <TextField
                  label="链接"
                  required
                  placeholder="https:// 或 /站内路径"
                  value={b.url}
                  onChange={(v) => update(b.key, { url: v })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="样式"
                    value={b.style}
                    onChange={(v) => update(b.key, { style: v })}
                    options={[
                      { label: "主按钮", value: "primary" },
                      { label: "次按钮", value: "secondary" },
                      { label: "描边", value: "outline" },
                    ]}
                  />
                  <SelectField
                    label="图标（可选）"
                    value={b.icon}
                    onChange={(v) => update(b.key, { icon: v })}
                    options={iconOptions}
                  />
                </div>
              </>
            ) : null}

            {b.blockType === "step" ? (
              <>
                <TextField label="步骤标题" required value={b.title} onChange={(v) => update(b.key, { title: v })} />
                <RichTextArea
                  label="步骤说明"
                  value={b.bodyText}
                  onChange={(v) => update(b.key, { bodyText: v })}
                  complex={b.bodyComplex}
                  cmsHref={cmsHref}
                />
                <div>
                  <FieldLabel label="配图（可选）" />
                  <SingleImageUpload value={b.image} onChange={(v) => update(b.key, { image: v })} />
                </div>
              </>
            ) : null}

            {b.blockType === "qrcode" ? (
              <>
                <div>
                  <FieldLabel label="二维码图片" required />
                  <SingleImageUpload value={b.image} onChange={(v) => update(b.key, { image: v })} />
                </div>
                <TextField
                  label="标题（如：扫码加微信）"
                  value={b.label}
                  onChange={(v) => update(b.key, { label: v })}
                />
                <TextField label="说明（可选）" value={b.caption} onChange={(v) => update(b.key, { caption: v })} />
              </>
            ) : null}

            {b.blockType === "callout" ? (
              <>
                <SelectField
                  label="语气"
                  value={b.tone}
                  onChange={(v) => update(b.key, { tone: v })}
                  options={[
                    { label: "信息", value: "info" },
                    { label: "警告", value: "warning" },
                    { label: "成功", value: "success" },
                  ]}
                />
                <RichTextArea
                  label="内容"
                  value={b.text}
                  onChange={(v) => update(b.key, { text: v })}
                  complex={b.complex}
                  cmsHref={cmsHref}
                />
              </>
            ) : null}

            {b.blockType === "download" ? (
              <>
                <div>
                  <FieldLabel label="安装包文件" required />
                  <FileUpload value={b.file} onChange={(v) => update(b.key, { file: v })} />
                </div>
                <TextField
                  label="按钮文字"
                  required
                  placeholder="如：下载安卓版"
                  value={b.label}
                  onChange={(v) => update(b.key, { label: v })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="平台"
                    value={b.platform}
                    onChange={(v) => update(b.key, { platform: v })}
                    options={[
                      { label: "安卓 Android", value: "android" },
                      { label: "苹果 iOS", value: "ios" },
                      { label: "其他", value: "other" },
                    ]}
                  />
                  <TextField
                    label="版本号（可选）"
                    placeholder="v2.3.1"
                    value={b.version}
                    onChange={(v) => update(b.key, { version: v })}
                  />
                </div>
                <TextField
                  label="说明（可选）"
                  placeholder="如：支持安卓 7.0+"
                  value={b.note}
                  onChange={(v) => update(b.key, { note: v })}
                />
              </>
            ) : null}
          </div>
        </div>
      ))}

      {/* 添加积木调色板 */}
      {adding ? (
        <div className="flex flex-wrap gap-2 rounded border border-line bg-surface p-3">
          {(Object.keys(BLOCK_TYPE_LABEL) as EditBlockType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onChange([...value, makeBlock(type)]);
                setAdding(false);
              }}
              className="rounded border border-line bg-panel px-3.5 py-1.5 text-[12.5px] text-ink transition-colors hover:border-accent"
            >
              {BLOCK_TYPE_LABEL[type]}
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
          <Plus size={14} /> 添加积木
        </button>
      )}
    </div>
  );
}
