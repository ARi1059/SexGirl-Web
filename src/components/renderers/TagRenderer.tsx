import type { Product } from "@/payload-types";
import { LucideGlyph } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** 单个标签 Block —— 从生成类型派生，schema 改动会在此处编译期报错 */
type TagBlock = NonNullable<NonNullable<Product["tags"]>[number]>;

/** style JSON 字段的实际结构（text/colorBlock 用），从松散 JSON 窄化 */
type TagStyle = { color?: string; bg?: string };

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

/** text：uppercase 小标签 + 1px 玫瑰粉下划线；style(json) 可覆写 color/bg（设计规范 §6.3） */
function TextTag({ label, style }: { label: string; style: unknown }) {
  const { color, bg } = parseStyle(style);
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-xs uppercase tracking-[0.08em] text-ink decoration-accent underline decoration-1 underline-offset-4"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

/** icon：1.5px 线性 Lucide 图标 + 行内 label；未知图标降级为纯文字 */
function IconTag({ label, icon }: { label: string; icon: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
      <LucideGlyph name={icon} size={14} strokeWidth={1.5} aria-hidden />
      <span>{label}</span>
    </span>
  );
}

/** colorBlock：12px 方形色块（编辑风用方不用圆）+ label（设计规范 §6.3） */
function ColorBlockTag({ label, style }: { label: string; style: unknown }) {
  const { bg } = parseStyle(style);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
      <span
        className="inline-block h-3 w-3 shrink-0 border border-line"
        style={{ background: bg ?? "var(--nude)" }}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}

/** link：label + ↗，hover 下划线，新标签打开（noopener） */
function LinkTag({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-xs text-ink decoration-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
    >
      <span>{label}</span>
      <span aria-hidden>↗</span>
    </a>
  );
}

/** 按 blockType 分发单个标签；未知类型降级为 null（设计规范 §6.3 / 开发文档 §5.2） */
function Tag({ tag }: { tag: TagBlock }) {
  switch (tag.blockType) {
    case "text":
      return <TextTag label={tag.label} style={tag.style} />;
    case "icon":
      return <IconTag label={tag.label} icon={tag.icon} />;
    case "colorBlock":
      return <ColorBlockTag label={tag.label} style={tag.style} />;
    case "link":
      return <LinkTag label={tag.label} url={tag.url} />;
    default:
      return null;
  }
}

/** 标签组渲染器：横向排列、space-2 间隔、超出换行（设计规范 §6.3） */
export function TagRenderer({
  tags,
  className,
}: {
  tags: Product["tags"];
  className?: string;
}) {
  if (!tags?.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {tags.map((tag, i) => (
        <Tag key={tag.id ?? i} tag={tag} />
      ))}
    </div>
  );
}
