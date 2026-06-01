import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer";
import { getMyFavorites } from "@/lib/favorites";
import { Gallery } from "@/components/gallery/Gallery";
import { LogoutButton } from "@/components/account/LogoutButton";

export const metadata: Metadata = { title: "个人中心 · 定制商品展示" };

// 个人中心 /me（开发计划 M7-9）。每用户动态渲染，绝不进 CDN / ISR（开发文档 §7.4 / §7.6）。
export const dynamic = "force-dynamic";

export default async function MePage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?redirect=/me"); // 未登录跳登录（§7.6）

  const favorites = await getMyFavorites();
  const name = customer.nickname?.trim() || customer.username;

  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(20px,5vw,96px)] py-[clamp(48px,8vw,120px)]">
      <header className="mb-[clamp(32px,5vw,64px)] border-t-[1.5px] border-line-strong pt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-overline uppercase text-ink-muted">个人中心</p>
            <h1 className="mt-2 font-display text-display-l font-semibold">{name} 的收藏</h1>
          </div>
          <LogoutButton />
        </div>
        <p className="mt-3 text-overline uppercase text-ink-muted">{favorites.length} 款已收藏</p>
      </header>

      {favorites.length ? (
        <Gallery products={favorites} />
      ) : (
        <p className="text-body text-ink-muted">还没有收藏。回画廊点心形即可收藏心仪款式。</p>
      )}
    </div>
  );
}
