import type { Media } from "@/payload-types";

/** next/image 渲染所需的最小图片信息（已确保 url/宽/高俱在） */
export type ResolvedImage = { url: string; width: number; height: number; alt: string };

type SizeKey = "thumbnail" | "card" | "full";

// 各偏好尺寸的回退顺序：取不到偏好尺寸时逐级放大，最后回退原图。
const ORDER: Record<SizeKey, SizeKey[]> = {
  thumbnail: ["thumbnail", "card", "full"],
  card: ["card", "full"],
  full: ["full"],
};

/**
 * 把 upload 字段（Media 对象 / 未展开的关联 id / 缺失）窄化为可直接喂给 next/image 的数据。
 * - 未 depth 展开的 id 或缺失 → null（调用方据此降级，不会把 number 当 src）。
 * - url 原样返回：本地开发是相对路径 /api/media/file/*（同源，next/image 免 remotePatterns）；
 *   生产切到 Supabase Storage 后是绝对 URL，同一函数透明兼容（M4-3 再配 remotePatterns）。
 * 设计规范 §5：列表卡取 card(800w)，详情大图取 full(1600w)。
 */
export function resolveImage(
  value: Media | number | null | undefined,
  prefer: SizeKey = "card",
): ResolvedImage | null {
  if (!value || typeof value === "number") return null;
  const m = value;
  for (const key of ORDER[prefer]) {
    const s = m.sizes?.[key];
    if (s?.url && s.width && s.height) {
      return { url: s.url, width: s.width, height: s.height, alt: m.alt ?? "" };
    }
  }
  // 原图回退（如 full 未生成 —— 原图本身就 ≤ full 目标宽，原图即最大可用尺寸）
  if (m.url && m.width && m.height) {
    return { url: m.url, width: m.width, height: m.height, alt: m.alt ?? "" };
  }
  return null;
}
