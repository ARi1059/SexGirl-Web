import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FavoritesProvider } from "@/components/favorite/FavoritesProvider";
import { AccountNav } from "@/components/account/AccountNav";

// 前台路由组布局（设计规范 §6.7）：sticky 刊头 + 页脚 + 主题容器。
// 根 layout（src/app/layout.tsx）持有 <html>/<body> 与防闪烁脚本；此处只搭前台外壳。
// 页面各自负责内容区的 max-width 与左右边距（§4），故 <main> 不加内边距。
// FavoritesProvider（client）包裹全站，提供会员态/收藏态；登录态只在客户端读，
// 本 layout 保持 server 组件且静态，ISR 不被污染（开发文档 §7.4）。
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
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
            定制商品
          </Link>
          <div className="flex items-center gap-5">
            <AccountNav />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-line px-[clamp(20px,5vw,96px)] py-8 text-small text-ink-muted">
          定制商品展示 · 看中款式，微信 / QQ 私聊定制
        </footer>
      </div>
    </FavoritesProvider>
  );
}

