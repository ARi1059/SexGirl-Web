import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";

// 自建品牌后台的 root layout（持 <html>/<body>）。本项目第三个 root layout——
// 与 (site)（前台）、(payload)（Payload 原生后台 /cms）并列。Next 16 多 root layout
// 约定：每组各持 <html>/<body>，跨组导航（/admin ↔ 前台 /）整页刷新，组内软导航。
//
// 复用前台设计令牌（../globals.css）：暖纸+玫瑰粉、Fraunces+Inter、.dark 暗色。
// 不包前台的 FavoritesProvider（那是前台会员态）；后台会话走 Payload users cookie，
// 由 (panel)/layout.tsx 的服务端鉴权门 requireAdmin 守卫。

export const metadata: Metadata = {
  title: "管理后台 · 定制商品",
};

// 防暗色首帧闪烁（FOUC）：与 (site)/layout 同一脚本，首帧前按 localStorage / 系统偏好定主题。
const themeInit = `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full bg-panel font-sans text-ink">{children}</body>
    </html>
  );
}
