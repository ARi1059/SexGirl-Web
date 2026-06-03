"use client";

import type { Media } from "@/payload-types";
import { resolveImage } from "@/lib/media";
import { QrViewer } from "@/components/renderers/QrViewer";

// 二维码积木的展示卡 —— 唯一的 client 岛（因复用 client 的 QrViewer：缩放/长按保存）。
// 卡框对齐 Figma QRCard：发丝线描边 + 纸底 + 居中。label 作卡标题（衬线），
// caption 作 QrViewer 下方的扫码说明。图缺失且无 label 时整卡不渲染（优雅降级）。
export function QrCard({
  image,
  label,
  caption,
}: {
  image: Media | number | null | undefined;
  label?: string | null;
  caption?: string | null;
}) {
  const has = !!resolveImage(image, "thumbnail");
  if (!has && !label) return null;
  return (
    <div className="flex flex-col items-center gap-4 border border-line bg-paper px-5 pb-[22px] pt-7 text-center">
      {label ? (
        <p className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">{label}</p>
      ) : null}
      <QrViewer image={image} hint={caption ?? "扫码添加"} />
    </div>
  );
}
