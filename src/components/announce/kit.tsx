import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { AnnouncementBlock } from "@/lib/announcements";
import { resolveImage } from "@/lib/media";
import { LucideGlyph } from "@/lib/icons";
import { cn } from "@/lib/utils";

// 公告积木的视觉基元 —— 把 Figma 原型（UI Style Redesign/.../AnnounceKit.tsx）的内联样式
// 翻成项目 Tailwind 语义 token（--site-accent* → accent*，直角无投影，发丝线分隔）。
// 全部 server 组件（无 hook）：按钮 hover 走 CSS `hover:` 变体，故不需要 client。
// 唯一的 client 岛是二维码卡（QrCard.tsx，因复用 client 的 QrViewer）。

// 各积木的精确类型从生成的 body 联合里按 blockType 取出，schema 改动会编译期报错。
type ImageBlock = Extract<AnnouncementBlock, { blockType: "image" }>;
type ButtonBlock = Extract<AnnouncementBlock, { blockType: "button" }>;
type StepBlock = Extract<AnnouncementBlock, { blockType: "step" }>;
type CalloutBlock = Extract<AnnouncementBlock, { blockType: "callout" }>;
type DownloadBlock = Extract<AnnouncementBlock, { blockType: "download" }>;

/** richText / step.body / callout.content 的 Lexical 值（同一形状）。 */
type RichTextValue = Extract<AnnouncementBlock, { blockType: "richText" }>["content"];

// ── 富文本 ──────────────────────────────────────────────────────────────────
// 复用详情页同款 .richtext 排版（globals.css），空值不渲染。
function Prose({ data, className }: { data: RichTextValue; className?: string }) {
  if (!data) return null;
  return <RichText data={data} className={cn("richtext", className)} />;
}

// ── Overline 小标 ─────────────────────────────────────────────────────────────
export function Overline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("block text-overline font-medium uppercase text-accent", className)}>
      {children}
    </span>
  );
}

// ── 发丝线分隔 ────────────────────────────────────────────────────────────────
export function Divider({ mt = 0, mb = 0 }: { mt?: number; mb?: number }) {
  return <hr className="border-0 border-t border-line" style={{ marginTop: mt, marginBottom: mb }} />;
}

// ── 图片积木 ──────────────────────────────────────────────────────────────────
// 上传图按原始比例自适应（不裁切），发丝线描边 + 可选 uppercase 图注。
export function AnnounceImage({ image, caption }: { image: ImageBlock["image"]; caption?: string | null }) {
  const img = resolveImage(image, "full");
  if (!img) return null;
  return (
    <figure className="m-0">
      <div className="overflow-hidden border border-line bg-surface">
        <Image
          src={img.url}
          alt={img.alt || caption || ""}
          width={img.width}
          height={img.height}
          sizes="(max-width: 760px) 100vw, 760px"
          className="block h-auto w-full object-cover"
        />
      </div>
      {caption ? (
        <figcaption className="mt-2.5 text-center text-[11.5px] uppercase tracking-[0.1em] text-ink-subtle">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

// ── 按钮积木 ──────────────────────────────────────────────────────────────────
// block 的 url 必填 → 渲染链接（外链新窗口 / 内链 next/link），不是 <button>。
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-none font-sans font-medium tracking-[0.02em] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";

const BTN_VARIANT: Record<NonNullable<ButtonBlock["style"]>, string> = {
  primary: "bg-accent-strong text-on-accent hover:bg-accent",
  secondary: "border border-accent text-accent hover:bg-accent-soft",
  outline: "border border-line text-ink-muted hover:bg-surface hover:text-ink",
};

const BTN_SIZE: Record<"sm" | "md" | "lg", { cls: string; icon: number }> = {
  sm: { cls: "px-4 py-2 text-[12.5px]", icon: 14 },
  md: { cls: "px-[22px] py-[11px] text-[13.5px]", icon: 16 },
  lg: { cls: "px-7 py-3.5 text-[15px]", icon: 18 },
};

const isExternal = (url: string): boolean =>
  /^(https?:)?\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:");

export function Btn({
  label,
  url,
  style,
  icon,
  size = "md",
  fullWidth = false,
}: {
  label: string;
  url: string;
  style?: ButtonBlock["style"];
  icon?: string | null;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  const s = BTN_SIZE[size];
  const className = cn(BTN_BASE, BTN_VARIANT[style ?? "primary"], s.cls, fullWidth && "w-full");
  const inner = (
    <>
      {icon ? <LucideGlyph name={icon} size={s.icon} strokeWidth={1.5} aria-hidden /> : null}
      {label}
    </>
  );
  if (isExternal(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={url} className={className}>
      {inner}
    </Link>
  );
}

// ── 下载按钮积木 ──────────────────────────────────────────────────────────────
// 引用「安装包」集合的上传文件（depth:2 已展开为对象）→ 原生 <a download>。
// platform 决定图标名（白名单 lib/icons：安卓 Smartphone / iOS Apple / 其他 Download），
// 经 LucideGlyph 渲染（遵守 React Compiler：不在 render 内把查表结果当 JSX 标签）。
const PLATFORM_ICON: Record<NonNullable<DownloadBlock["platform"]>, string> = {
  android: "Smartphone",
  ios: "Apple",
  other: "Download",
};

export function DownloadBtn({
  file,
  label,
  platform,
  version,
  note,
}: {
  file: DownloadBlock["file"];
  label: string;
  platform?: DownloadBlock["platform"];
  version?: string | null;
  note?: string | null;
}) {
  // 未 depth 展开（number）或缺失 → 不渲染（防御，同 resolveImage 思路）。
  if (!file || typeof file !== "object") return null;
  const url = file.url;
  if (!url) return null;
  const iconName = PLATFORM_ICON[platform ?? "other"];
  const sub = [version, note].filter(Boolean).join(" · ");
  return (
    <a
      href={url}
      download
      className="inline-flex items-center gap-3 rounded-none border border-accent-strong bg-accent-strong px-6 py-3.5 text-on-accent transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
    >
      <LucideGlyph name={iconName} size={20} strokeWidth={1.5} aria-hidden />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-medium tracking-[0.02em]">{label}</span>
        {sub ? <span className="text-[12px] font-normal opacity-85">{sub}</span> : null}
      </span>
    </a>
  );
}

// ── 图文步骤积木 ──────────────────────────────────────────────────────────────
// 大号衬线序号（描边镂空）+ 标题 + 富文本说明 + 可选配图。number 由分发器按
// step 出现次序传入（01/02/03…）。响应式断点对齐原型 ANN_CSS（580 / 860）。
export function Step({
  number,
  title,
  body,
  image,
}: {
  number: number;
  title: string;
  body: StepBlock["body"];
  image?: StepBlock["image"];
}) {
  const img = resolveImage(image ?? null, "card");
  return (
    <div>
      <Divider />
      <div className="flex flex-col gap-4 py-7 min-[580px]:flex-row min-[580px]:items-start min-[580px]:gap-8">
        {/* 大号衬线序号 */}
        <div className="leading-none min-[580px]:w-24 min-[580px]:shrink-0 min-[580px]:pt-1.5 min-[860px]:w-[120px]">
          <span className="block font-display text-[clamp(4.5rem,9vw,6rem)] font-semibold leading-none tracking-[-0.03em] text-accent-soft [-webkit-text-stroke:1.5px_var(--accent)]">
            {String(number).padStart(2, "0")}
          </span>
        </div>
        {/* 正文 + 配图 */}
        <div className="flex flex-1 flex-col gap-5 min-[580px]:flex-row min-[580px]:items-start">
          <div className="flex-1">
            <h3 className="mb-3 font-display text-[clamp(1.1rem,2.5vw,1.3rem)] font-semibold leading-snug tracking-[-0.01em] text-ink">
              {title}
            </h3>
            <Prose data={body} />
          </div>
          {img ? (
            <div className="flex justify-center min-[580px]:w-40 min-[580px]:shrink-0 min-[580px]:justify-start min-[860px]:w-[180px]">
              <Image
                src={img.url}
                alt={img.alt || title}
                width={img.width}
                height={img.height}
                sizes="(max-width: 580px) 100vw, 180px"
                className="block h-auto w-full border border-line object-cover"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── 提示框积木 ────────────────────────────────────────────────────────────────
// tone → 左边框 + 底色 + 标签色。正文沿用 .richtext 标准墨色（在浅底上可读性最佳）。
const CALLOUT: Record<NonNullable<CalloutBlock["tone"]>, { box: string; label: string; labelCls: string }> = {
  warning: { box: "border-accent-strong bg-accent-soft", label: "注意", labelCls: "text-accent-strong" },
  info: { box: "border-ink-subtle bg-surface", label: "提示", labelCls: "text-ink-muted" },
  success: { box: "border-[#5d8a52] bg-[rgba(93,138,82,0.08)]", label: "完成", labelCls: "text-[#5d8a52]" },
};

export function Callout({ tone, content }: { tone?: CalloutBlock["tone"]; content: CalloutBlock["content"] }) {
  const c = CALLOUT[tone ?? "info"];
  return (
    <div className={cn("border-l-[3px] px-5 py-4", c.box)}>
      <p className={cn("mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em]", c.labelCls)}>
        {c.label}
      </p>
      <Prose data={content} />
    </div>
  );
}

// ── 装饰：指南针（仅「如何永久找到我们」用）──────────────────────────────────
// 纯静态点缀，无数据依赖。照搬原型 FindUsPage.tsx CompassIllustration，
// 把 --site-accent* 换成 accent*。栅格线位置用内联百分比（动态值）。
export function CompassIllustration() {
  return (
    <div className="relative flex aspect-[21/9] w-full items-center justify-center overflow-hidden border border-line bg-surface">
      {/* 栅格横线 */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={`h${i}`}
          aria-hidden
          className="absolute inset-x-0 h-px bg-line opacity-50"
          style={{ top: `${i * 20}%` }}
        />
      ))}
      {/* 栅格竖线 */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div
          key={`v${i}`}
          aria-hidden
          className="absolute inset-y-0 w-px bg-line opacity-50"
          style={{ left: `${i * 10}%` }}
        />
      ))}
      {/* 中心玫瑰针 */}
      <div className="relative z-[1] flex flex-col items-center gap-1">
        <svg width="40" height="48" viewBox="0 0 40 48" fill="none" aria-hidden>
          <path
            d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28S40 35 40 20C40 9 31 0 20 0z"
            fill="var(--accent)"
          />
          <circle cx="20" cy="20" r="8" fill="white" opacity="0.9" />
          <circle cx="20" cy="20" r="4" fill="var(--accent-strong)" />
        </svg>
        <span className="whitespace-nowrap bg-ink px-2.5 py-[3px] text-[10px] uppercase tracking-[0.08em] text-paper">
          永远在这里
        </span>
      </div>
    </div>
  );
}
