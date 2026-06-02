"use client";

import { Info } from "lucide-react";
import { FieldLabel } from "./fields";

// 简化富文本：纯文本多段（每行一个段落）。提交时 textToLexical，回填时 lexicalToText。
// complex=true 时（描述曾在 /cms 设过富格式）给警示条，保存会压平为纯文字，但保留 /cms 深链兜底。
export function RichTextEditor({
  value,
  onChange,
  complex,
  cmsHref,
}: {
  value: string;
  onChange: (v: string) => void;
  complex: boolean;
  cmsHref?: string;
}) {
  return (
    <div>
      <FieldLabel label="描述（富文本）" />
      {complex ? (
        <div className="mb-2 flex items-start gap-2 rounded border border-accent-soft bg-accent-soft/50 px-3 py-2 text-[11.5px] leading-relaxed text-accent-strong">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            此描述含富格式（标题/加粗/列表等），简化编辑器仅保留纯文字，保存将压平格式。如需保留，请用{" "}
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
        rows={7}
        placeholder="在此输入商品描述…"
        className="w-full resize-y rounded border border-line bg-surface px-3.5 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-accent focus:ring-2 focus:ring-accent-soft"
      />
      <p className="mt-1.5 text-[11.5px] text-ink-subtle">每行将作为一个段落显示。</p>
    </div>
  );
}
