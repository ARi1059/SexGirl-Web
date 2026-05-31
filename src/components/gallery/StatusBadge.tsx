import { cn } from "@/lib/utils";

/**
 * 状态徽标（设计规范 §6.2）：用「点 + 字」而非纯色块，不只靠颜色传意。
 * - availableToday → 玫瑰粉实心点 + 同色标签（文字取 statusText，缺省「今日可制作」）。
 * - 否则有 statusText → ink-subtle 点 + 同色标签（如「已约满」「需预约 3 天」）。
 * - 两者皆无 → 不渲染。
 * 列表卡与详情页共用。
 */
export function StatusBadge({
  availableToday,
  statusText,
  className,
}: {
  availableToday?: boolean | null;
  statusText?: string | null;
  className?: string;
}) {
  const text = availableToday ? statusText?.trim() || "今日可制作" : statusText?.trim();
  if (!text) return null;
  const accent = Boolean(availableToday);
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-overline uppercase",
        accent ? "text-accent" : "text-ink-subtle",
        className,
      )}
    >
      <span
        className={cn("inline-block h-1.5 w-1.5 rounded-full", accent ? "bg-accent" : "bg-ink-subtle")}
        aria-hidden
      />
      {text}
    </p>
  );
}
