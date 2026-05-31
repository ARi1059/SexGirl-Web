"use client";

import { MessageCircle, ExternalLink } from "lucide-react";
import type { Contact } from "@/payload-types";
import { CopyButton } from "./CopyButton";
import { QrViewer } from "./QrViewer";

/** 渠道眉标：左侧小标识（微信 / QQ），uppercase overline 风格 */
function Channel({ children }: { children: string }) {
  return (
    <span className="shrink-0 text-overline uppercase tracking-[0.16em] text-accent">
      {children}
    </span>
  );
}

/** 一行联系方式：value 用 mono 字体 + 复制按钮（设计规范 §6.6） */
function ValueRow({
  channel,
  value,
  children,
}: {
  channel: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Channel>{channel}</Channel>
      <span className="grow font-mono text-sm text-ink">{value}</span>
      <CopyButton value={value} />
      {children}
    </div>
  );
}

/** 单个联系方式按 type 分发（wechat/wechatQr/qq/qqQr）；未知类型降级 null（开发文档 §5.3） */
function ContactItem({ contact }: { contact: Contact }) {
  const label = contact.label?.trim();

  switch (contact.type) {
    case "wechat":
      return (
        <div className="flex flex-col gap-1.5">
          {label ? <p className="text-sm text-ink-muted">{label}</p> : null}
          <ValueRow channel="微信" value={contact.value ?? ""} />
        </div>
      );

    case "qq":
      return (
        <div className="flex flex-col gap-1.5">
          {label ? <p className="text-sm text-ink-muted">{label}</p> : null}
          <ValueRow channel="QQ" value={contact.value ?? ""}>
            {/* QQ 深链：mqqwpa 唤起手机 QQ 临时会话；桌面端无 QQ 会降级为无反应 */}
            <a
              href={`mqqwpa://im/chat?chat_type=wpa&uin=${encodeURIComponent(contact.value ?? "")}`}
              className="inline-flex h-8 items-center gap-1 border border-ink px-3 text-xs text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            >
              <ExternalLink size={14} strokeWidth={1.5} />
              <span>打开QQ</span>
            </a>
          </ValueRow>
        </div>
      );

    case "wechatQr":
    case "qqQr":
      return (
        <div className="flex flex-col gap-2">
          {label ? (
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <MessageCircle size={14} strokeWidth={1.5} aria-hidden />
              {label}
            </p>
          ) : null}
          <QrViewer image={contact.qrImage} hint={label ?? "扫码添加"} />
        </div>
      );

    default:
      return null;
  }
}

/**
 * 联系方式渲染器：纵向列表、发丝线分隔（设计规范 §6.6）。
 * contacts 可能是关联 id（未 depth 展开）或完整 Contact 对象，只渲染已展开的对象。
 */
export function ContactRenderer({
  contacts,
  className,
}: {
  contacts: (number | Contact)[] | null | undefined;
  className?: string;
}) {
  const items = contacts?.filter((c): c is Contact => typeof c === "object" && c !== null);
  if (!items?.length) return null;

  return (
    <div className={className}>
      {items.map((contact, i) => (
        <div
          key={contact.id ?? i}
          className="border-line py-4 first:pt-0 last:pb-0 [&:not(:first-child)]:border-t"
        >
          <ContactItem contact={contact} />
        </div>
      ))}
    </div>
  );
}
