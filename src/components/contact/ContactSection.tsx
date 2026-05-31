"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import type { Contact } from "@/payload-types";
import { ContactRenderer } from "@/components/renderers/ContactRenderer";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * 联系方式区（设计规范 §6.6，开发计划 M3-5/M3-6）—— 引流转化核心。
 * 「联系定制」Primary 按钮 → 手写无障碍弹层：桌面居中 Modal / 移动底部 Drawer。
 * a11y：role=dialog + aria-modal、焦点陷阱、Esc 关闭、返回触发元素焦点、背景滚动锁、点遮罩关闭。
 * 内容复用既有 <ContactRenderer>（复制 / QQ 深链 / 二维码放大，M2 已完成）；本组件只建外壳。
 * 动效尊重 prefers-reduced-motion（仅淡入）。
 */
export function ContactSection({
  contacts,
  label,
  className,
}: {
  contacts: (number | Contact)[] | null | undefined;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const reduce = useReducedMotion();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // 桌面 / 移动断点（驱动 Modal vs Drawer 的入场动画方向）
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // 打开时：锁背景滚动 + 聚焦关闭按钮；关闭时（cleanup）：恢复 + 焦点返回触发元素
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current; // 捕获触发元素，关闭时焦点归还
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      trigger?.focus();
    };
  }, [open]);

  // Esc 关闭 + Tab 焦点陷阱
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  // 无可展开的联系方式则不渲染 CTA（避免空弹层）
  const hasContacts = contacts?.some((c) => typeof c === "object" && c !== null);
  if (!hasContacts) return null;

  const panelInitial = reduce
    ? { opacity: 0 }
    : isDesktop
      ? { opacity: 0, scale: 0.98 }
      : { opacity: 0, y: "100%" };
  const panelAnimate = reduce
    ? { opacity: 1 }
    : isDesktop
      ? { opacity: 1, scale: 1 }
      : { opacity: 1, y: 0 };

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center justify-center bg-accent-strong px-6 text-sm font-medium uppercase tracking-[0.08em] text-on-accent transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
      >
        联系定制
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[300] flex items-end justify-center p-0 md:items-center md:p-6"
            onKeyDown={onKeyDown}
          >
            {/* 背景蒙版 */}
            <motion.div
              className="absolute inset-0 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0.001 : 0.24 }}
              onClick={close}
            />

            {/* 面板：移动底部 Drawer / 桌面居中 Modal */}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative max-h-[85vh] w-full overflow-y-auto border border-line bg-surface p-6 shadow-[var(--shadow-overlay)] rounded-t-[var(--radius-xs)] md:w-[420px] md:rounded-[var(--radius-xs)]"
              initial={panelInitial}
              animate={panelAnimate}
              exit={panelInitial}
              transition={{ duration: reduce ? 0.001 : 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                ref={closeBtnRef}
                type="button"
                onClick={close}
                aria-label="关闭"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center border border-ink bg-paper text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              <header className="mb-4 border-b border-line pb-4 pr-12">
                <p className="text-overline uppercase tracking-[0.16em] text-accent">联系客服</p>
                <p id={titleId} className="mt-1 font-display text-h2 font-semibold">
                  {label?.trim() || "定制咨询"}
                </p>
              </header>

              <ContactRenderer contacts={contacts} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
