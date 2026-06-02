"use client";

import { type ChangeEvent, useId, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadMedia, type UploadedImage } from "./upload";

// 封面单图：空态虚线上传按钮 / 上传中 spinner / 有值预览 + 删除。
// 「删除」只清表单引用，不删 Media 文档（避免误删被别处引用的图）。
export function SingleImageUpload({
  value,
  onChange,
}: {
  value: UploadedImage | null;
  onChange: (v: UploadedImage | null) => void;
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
      onChange(await uploadMedia(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="relative w-full max-w-[240px] overflow-hidden rounded border border-line bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element -- 后台上传预览，无需 next/image */}
        <img src={value.url} alt="封面预览" className="aspect-[4/5] w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="移除封面"
          className="absolute right-2 top-2 grid size-7 place-items-center rounded bg-black/50 text-white transition-colors hover:bg-black/70"
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
        className="flex w-full max-w-[240px] cursor-pointer flex-col items-center gap-2 rounded border-[1.5px] border-dashed border-line bg-surface px-5 py-8 text-center transition-colors hover:border-accent hover:bg-accent-soft/40"
      >
        {uploading ? (
          <Loader2 size={20} className="animate-spin text-accent" />
        ) : (
          <span className="grid size-10 place-items-center rounded-lg bg-accent-soft">
            <ImagePlus size={18} className="text-accent" />
          </span>
        )}
        <span className="text-[13.5px] font-medium text-ink">{uploading ? "上传中…" : "点击上传图片"}</span>
        <span className="text-xs text-ink-subtle">JPG · PNG · WebP · 最大 10 MB</span>
      </label>
      <input id={inputId} type="file" accept="image/*" hidden onChange={handleFile} disabled={uploading} />
      {error ? <p className="mt-2 text-[11.5px] text-accent-strong">{error}</p> : null}
    </div>
  );
}
