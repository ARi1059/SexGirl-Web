import { resolveImage } from "@/lib/media";
import type { Media } from "@/payload-types";

/**
 * 后台列表封面缩略图。复用 lib/media 的 resolveImage（取 thumbnail 尺寸，带回退）。
 * 小图、同源，用普通 img 即可（无需 next/image 优化），与 components/admin/CoverCell 同思路。
 * 取不到图 → 占位方块。
 */
export function Thumb({
  value,
  size = 40,
}: {
  value: Media | number | null | undefined;
  size?: number;
}) {
  const img = resolveImage(value, "thumbnail");
  if (!img) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-md bg-surface text-ink-subtle"
        style={{ width: size, height: size }}
      >
        —
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 后台列表小缩略图，无需 next/image
    <img
      src={img.url}
      alt={img.alt}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-md object-cover"
      style={{ width: size, height: size }}
    />
  );
}
