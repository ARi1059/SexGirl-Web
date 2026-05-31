import type { Metadata } from "next";
import "./globals.css";

// 注：本环境无法在构建期访问 fonts.gstatic.com，故暂不使用 next/font。
// 字体经 globals.css 的 --font-*-web 变量预留接入点：将来在可联网环境
// 或自托管字体时，用 next/font 设置这些变量即可自动启用 Fraunces / Inter / Geist Mono，
// 当前回退到系统字体（详见 docs/前端设计规范.md §2.2 / §10）。

export const metadata: Metadata = {
  title: "定制商品展示",
  description: "精选定制商品画廊 —— 看中款式，微信 / QQ 私聊定制。",
};

// 防暗色主题首帧闪烁（FOUC）：首帧前按 localStorage / 系统偏好定主题。详见设计规范 §3
const themeInit = `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
