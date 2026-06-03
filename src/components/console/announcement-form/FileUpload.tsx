"use client";

import { type ChangeEvent, useId, useState } from "react";
import { FileDown, FileUp, Loader2, X } from "lucide-react";
import { uploadDownload } from "./upload";
import type { UploadedFile } from "./types";

// 安装包上传控件（仿 product-form/SingleImageUpload，但展示文件名而非图片预览）。
// 「移除」只清表单引用，不删 downloads 文档（避免误删别处引用的安装包）。
export function FileUpload({
  value,
  onChange,
}: {
  value: UploadedFile | null;
  onChange: (v: UploadedFile | null) => void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允许重复选同一文件
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      onChange(await uploadDownload(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded border border-line bg-surface px-3.5 py-3">
        <FileDown size={18} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{value.filename}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="移除安装包"
          className="grid size-7 shrink-0 place-items-center rounded text-ink-subtle transition-colors hover:text-accent-strong"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="flex w-full cursor-pointer items-center gap-2 rounded border-[1.5px] border-dashed border-line bg-surface px-4 py-4 transition-colors hover:border-accent hover:bg-accent-soft/40"
      >
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-accent" />
        ) : (
          <FileUp size={18} className="text-accent" />
        )}
        <span className="text-[13px] font-medium text-ink">{uploading ? "上传中…" : "点击上传安装包"}</span>
        <span className="ml-auto text-xs text-ink-subtle">APK · IPA 等</span>
      </label>
      <input
        id={inputId}
        type="file"
        accept=".apk,.ipa,.plist,.zip,application/octet-stream,application/vnd.android.package-archive"
        hidden
        onChange={handleFile}
        disabled={uploading}
      />
      {error ? <p className="mt-2 text-[11.5px] text-accent-strong">{error}</p> : null}
    </div>
  );
}
