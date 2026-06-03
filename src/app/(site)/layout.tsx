import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "../globals.css";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FavoritesProvider } from "@/components/favorite/FavoritesProvider";
import { FavoritesNavLink } from "@/components/favorite/FavoritesNavLink";
import { AccountNav } from "@/components/account/AccountNav";
import { getSiteSettings } from "@/lib/site";

// 前台路由组的根布局（root layout）：持有 <html>/<body>。
// Payload 后台 (payload) 组经 @payloadcms/next 的 RootLayout 自带 <html>/<body>，
// 是另一个独立 root layout；因此 app 根目录不再放 layout.tsx（避免嵌套 <html>、
// 防闪烁 <script> 落到孤立 <head> 而不执行）。多 root layout 见 Next.js 路由组约定。
//
// 注：本环境无法在构建期访问 fonts.gstatic.com，故暂不使用 next/font。
// 字体经 globals.css 的 --font-*-web 变量预留接入点：将来在可联网环境
// 或自托管字体时，用 next/font 设置这些变量即可自动启用 Fraunces / Inter / Geist Mono，
// 当前回退到系统字体（详见 docs/前端设计规范.md §2.2 / §10）。

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return { title: s.metaTitle, description: s.metaDesc };
}

// 防暗色主题首帧闪烁（FOUC）：首帧前按 localStorage / 系统偏好定主题。详见设计规范 §3
const themeInit = `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');}catch(e){}})();`;

// 前台外壳（设计规范 §6.7）：sticky 刊头 + 页脚 + 主题容器。
// 页面各自负责内容区的 max-width 与左右边距（§4），故 <main> 不加内边距。
// FavoritesProvider（client）包裹全站，提供会员态/收藏态；登录态只在客户端读，
// 本 layout 保持 server 组件且静态，ISR 不被污染（开发文档 §7.4）。
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const s = await getSiteSettings();
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <FavoritesProvider>
          <div className="flex min-h-full flex-col bg-paper text-ink">
            {/* 刊头 —— 过渡中由 site-header 锚定不动（globals.css 视图过渡块）*/}
            <header
              style={{ viewTransitionName: "site-header" }}
              className="sticky top-0 z-[100] flex items-center justify-between border-b border-line bg-paper/90 px-[clamp(20px,5vw,96px)] py-5 backdrop-blur"
            >
              <Link
                href="/"
                className="font-display text-xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
              >
                {s.siteName}
              </Link>
              <div className="flex items-center gap-4">
                <FavoritesNavLink />
                <AccountNav />
                <Link
                  href="/admin"
                  className="border border-line px-3 py-1.5 text-overline uppercase text-ink-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                >
                  后台
                </Link>
                <ThemeToggle />
              </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-[clamp(20px,5vw,96px)] py-8 text-small text-ink-muted">
              <span>{s.footerText}</span>
              <nav aria-label="页脚导航" className="flex gap-5 text-overline uppercase">
                <Link href="/" className="transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]">
                  画廊
                </Link>
                <Link href="/login" className="transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]">
                  登录
                </Link>
                <Link href="/admin" className="transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]">
                  管理后台
                </Link>
              </nav>
            </footer>
          </div>
        </FavoritesProvider>
      </body>
    </html>
  );
}
