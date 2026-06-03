"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteTheme } from "@/lib/site";

// 外观主题切换表单（client）。两张可选主题卡（带真实配色的迷你预览），保存走 Payload Global 的 REST：
// POST /api/globals/appearance（cookie 鉴权，服务端 access.update = isSuperAdmin 强制）。
// 保存成功 router.refresh() 同步前台与本页「当前生效」标记。保存模式镜像 SiteSettingsForm。
// 注：仅 `import type { SiteTheme }`（类型擦除，不把 lib/site 的 server 代码拉进 client bundle）。

// 各主题的代表色取自 globals.css 的语义令牌（浅色）：default = 暖纸玫瑰粉，ios = Apple HIG。
// 用于卡片内迷你预览的内联色值（预览用字面 hex，不受当前后台主题影响，真实反映前台效果）。
type Swatch = { paper: string; surface: string; ink: string; muted: string; accent: string; line: string };

const THEMES: { value: SiteTheme; name: string; desc: string; sw: Swatch }[] = [
  {
    value: "default",
    name: "默认 · 暖纸玫瑰粉",
    desc: "暖白纸感背景 + 玫瑰粉强调色，Fraunces 衬线标题。本站原生品牌主题。",
    sw: { paper: "#FFFFFF", surface: "#FAF7F5", ink: "#15110F", muted: "#5C534D", accent: "#C96A72", line: "#E8E1DC" },
  },
  {
    value: "ios",
    name: "iOS · 苹果风",
    desc: "Apple 设计风格：系统蓝强调色、冷灰分层背景、SF 系统字体，简洁现代。",
    sw: { paper: "#FFFFFF", surface: "#F2F2F7", ink: "#000000", muted: "#8A8A8E", accent: "#007AFF", line: "#D1D1D6" },
  },
];

type Status = "idle" | "saving" | "saved" | "error";

function ThemePreview({ sw }: { sw: Swatch }) {
  return (
    <div style={{ background: sw.paper }} className="rounded-lg p-3">
      <div style={{ background: sw.surface, borderColor: sw.line }} className="rounded-md border p-3">
        <div style={{ color: sw.ink }} className="text-[13px] font-semibold">
          示例商品标题
        </div>
        <div style={{ color: sw.muted }} className="mt-0.5 text-[11px]">
          一段示例说明文字，展示正文配色
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <span
            style={{ background: sw.accent, color: "#FFFFFF" }}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          >
            主按钮
          </span>
          <span style={{ color: sw.accent }} className="text-[11px] font-medium">
            文本链接
          </span>
        </div>
      </div>
    </div>
  );
}

export function AppearanceForm({ initial }: { initial: SiteTheme }) {
  const router = useRouter();
  const [theme, setTheme] = useState<SiteTheme>(initial);
  const [live, setLive] = useState<SiteTheme>(initial); // 已落库生效的主题（保存成功后更新）
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dirty = theme !== live;
  const saving = status === "saving";

  async function handleSave() {
    setStatus("saving");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/globals/appearance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.errors?.[0]?.message ?? `保存失败（${res.status}）`);
      }
      setLive(theme);
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "保存失败");
    }
  }

  const liveLabel = THEMES.find((t) => t.value === live)?.name ?? live;

  return (
    <div className="max-w-3xl">
      {/* 操作栏 */}
      <div className="mb-5 flex items-center gap-3">
        <span className="text-small text-ink-subtle">
          当前生效：<span className="font-medium text-ink-muted">{liveLabel}</span>
        </span>
        {errorMsg ? <span className="text-small text-accent-strong">{errorMsg}</span> : null}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded border border-line px-3 py-2 text-small text-ink-muted transition-colors hover:text-ink"
        >
          <ExternalLink size={13} /> 查看前台
        </a>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || (!dirty && status !== "error")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-4 py-2 text-small font-medium text-white transition-colors disabled:opacity-50",
            status === "saved" ? "bg-[#5d8a52]" : "bg-accent hover:bg-accent-strong",
          )}
        >
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" /> 保存中…
            </>
          ) : status === "saved" ? (
            <>
              <Check size={13} /> 已保存
            </>
          ) : (
            <>
              <Save size={13} /> 保存并发布
            </>
          )}
        </button>
      </div>

      {/* 主题卡片（单选） */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {THEMES.map((t) => {
          const selected = theme === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              aria-pressed={selected}
              className={cn(
                "group relative rounded-xl border bg-surface p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
                selected ? "border-accent ring-2 ring-accent-soft" : "border-line hover:border-ink-subtle",
              )}
            >
              {/* 选中标记 */}
              <span
                className={cn(
                  "absolute right-3 top-3 grid size-5 place-items-center rounded-full transition-colors",
                  selected ? "bg-accent text-white" : "border border-line text-transparent",
                )}
              >
                <Check size={12} strokeWidth={3} />
              </span>

              <div className="mb-3 flex items-center gap-2">
                <span className="font-display text-[15px] font-semibold text-ink">{t.name}</span>
                {t.value === live ? (
                  <span className="rounded-full bg-panel px-2 py-0.5 text-[10px] text-ink-muted">生效中</span>
                ) : null}
              </div>

              <ThemePreview sw={t.sw} />

              <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">{t.desc}</p>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[11.5px] text-ink-subtle">
        提示：主题切换仅影响前台网站，不改变本后台控制台外观；访客仍可用前台右上角 ☾/☀ 单独切换明暗模式。
      </p>
    </div>
  );
}
