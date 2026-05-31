import { ThemeToggle } from "@/components/ui/theme-toggle";

const SWATCHES: [string, string][] = [
  ["paper", "bg-paper border border-line"],
  ["surface", "bg-surface"],
  ["panel", "bg-panel"],
  ["ink", "bg-ink"],
  ["accent", "bg-accent"],
  ["accent-strong", "bg-accent-strong"],
  ["nude", "bg-nude"],
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-paper text-ink">
      {/* 刊头 Masthead */}
      <header className="sticky top-0 z-[100] flex items-center justify-between border-b border-line bg-paper/90 px-[clamp(20px,5vw,96px)] py-5 backdrop-blur">
        <span className="font-display text-xl font-semibold tracking-tight">定制商品</span>
        <ThemeToggle />
      </header>

      {/* Hero —— 设计系统基线展示 */}
      <main className="flex flex-1 flex-col justify-center px-[clamp(20px,5vw,96px)] py-[clamp(64px,10vw,160px)]">
        <p className="text-overline font-semibold uppercase text-accent">Editorial · 设计系统就绪</p>

        <h1 className="mt-6 max-w-[14ch] font-display text-display-xl font-semibold">
          精选定制，<br />私域专属。
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted">
          画廊式展示精致定制商品，看中款式即微信 / QQ 私聊定制成交。
          本页为设计系统基线 —— 杂志编辑风、双主题、玫瑰粉强调色，已可运行。点右上角切换明暗。
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <button className="h-12 bg-accent-strong px-6 font-medium uppercase tracking-wide text-on-accent transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]">
            联系定制
          </button>
          <button className="h-12 border border-ink px-6 font-medium text-ink transition-colors hover:bg-ink hover:text-paper">
            查看画廊
          </button>
        </div>

        {/* 调色板（验证令牌随主题切换） */}
        <div className="mt-16 flex flex-wrap gap-4">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className={`h-12 w-12 ${cls}`} />
              <span className="text-overline uppercase text-ink-subtle">{name}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-line px-[clamp(20px,5vw,96px)] py-8 text-sm text-ink-muted">
        定制商品展示 H5 · 设计系统基线 · 详见 docs/前端设计规范.md
      </footer>
    </div>
  );
}
