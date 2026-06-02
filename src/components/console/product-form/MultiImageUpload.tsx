"use client";

import { type ChangeEvent, useId, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
import { uploadMedia, type UploadedImage } from "./upload";

// 详情多图：缩略图网格（删除 + ←/→ 调序）+ 末尾「添加」（可多选）。
// 调序用箭头按钮（不引入拖拽依赖）。删除只清引用，不删 Media 文档。
export function MultiImageUpload({
  value,
  onChange,
}: {
  value: UploadedImage[];
  onChange: (v: UploadedImage[]) => void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(uploadMedia));
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "部分图片上传失败");
    } finally {
      setUploading(false);
    }
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((img, i) => (
          <div
            key={img.id}
            className="relative h-[117px] w-[88px] overflow-hidden rounded border border-line bg-surface"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 后台上传预览，无需 next/image */}
            <img src={img.url} alt={`详情图 ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="移除此图"
              className="absolute right-1 top-1 grid size-5 place-items-center rounded bg-black/45 text-white transition-colors hover:bg-black/70"
            >
              <X size={11} />
            </button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="左移"
                className="grid size-5 place-items-center rounded bg-black/45 text-white transition-opacity hover:bg-black/70 disabled:opacity-30"
              >
                <ChevronLeft size={11} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label="右移"
                className="grid size-5 place-items-center rounded bg-black/45 text-white transition-opacity hover:bg-black/70 disabled:opacity-30"
              >
                <ChevronRight size={11} />
              </button>
            </div>
          </div>
        ))}
        <label
          htmlFor={inputId}
          className="flex h-[117px] w-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded border-[1.5px] border-dashed border-line bg-surface text-ink-subtle transition-colors hover:border-accent"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin text-accent" />
          ) : (
            <Plus size={16} className="text-ink-muted" />
          )}
          <span className="text-[11px]">{uploading ? "上传中" : "添加"}</span>
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFiles}
          disabled={uploading}
        />
      </div>
      {error ? <p className="mt-2 text-[11.5px] text-accent-strong">{error}</p> : null}
    </div>
  );
}
