"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type Me = { id: number; username: string; nickname?: string | null };

type FavoritesContextValue = {
  me: Me | null;
  ready: boolean;
  isFavorited: (productId: number) => boolean;
  toggle: (productId: number) => void;
  logout: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites 必须在 <FavoritesProvider> 内使用");
  return ctx;
}

/**
 * 会员态 + 收藏态的客户端单一数据源（开发计划 M7-7/M7-8，开发文档 §7.4）。
 * 挂在 (site)/layout 包裹全站：mount 时拉一次 /api/customers/me 与本人 favorites，
 * AccountNav、FavoriteButton 共享，避免每个按钮各拉一次。
 * 关键：登录态/收藏态只在此客户端拉取，绝不在 server 共享 layout 读 —— ISR 静态缓存不被污染。
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  // productId -> favoriteDocId（乐观新增时临时为 -1，成功后替换为真实 id）
  const [favs, setFavs] = useState<Record<number, number>>({});

  // 初次加载：取当前客户 + 其收藏映射。
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const meRes = await fetch("/api/customers/me", { credentials: "include" });
        const meJson = await meRes.json().catch(() => ({}));
        const user: Me | null = meJson?.user
          ? {
              id: meJson.user.id,
              username: meJson.user.username,
              nickname: meJson.user.nickname,
            }
          : null;
        if (!active) return;
        setMe(user);

        if (user) {
          const favRes = await fetch("/api/favorites?depth=0&limit=200", {
            credentials: "include",
          });
          const favJson = await favRes.json().catch(() => ({ docs: [] }));
          if (!active) return;
          const map: Record<number, number> = {};
          for (const d of favJson?.docs ?? []) {
            const pid = typeof d.product === "object" ? d.product?.id : d.product;
            if (typeof pid === "number") map[pid] = d.id;
          }
          setFavs(map);
        }
      } catch {
        /* 网络错误：按未登录处理 */
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const isFavorited = useCallback((productId: number) => productId in favs, [favs]);

  const toggle = useCallback(
    (productId: number) => {
      // 未登录 → 引导登录，登录后回到当前页（开发文档 §7.7）。
      if (!me) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const existingId = favs[productId];
      if (existingId != null) {
        // 乐观取消收藏，失败回滚。
        setFavs((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        fetch(`/api/favorites/${existingId}`, { method: "DELETE", credentials: "include" })
          .then((r) => {
            if (!r.ok) throw new Error();
          })
          .catch(() => setFavs((prev) => ({ ...prev, [productId]: existingId })));
      } else {
        // 乐观新增（临时 id -1），成功后替换为真实 doc id，失败回滚。
        setFavs((prev) => ({ ...prev, [productId]: -1 }));
        fetch("/api/favorites", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: productId }),
        })
          .then(async (r) => {
            if (!r.ok) throw new Error();
            const json = await r.json().catch(() => ({}));
            const newId = json?.doc?.id;
            if (typeof newId === "number") {
              setFavs((prev) => ({ ...prev, [productId]: newId }));
            }
          })
          .catch(() =>
            setFavs((prev) => {
              const next = { ...prev };
              delete next[productId];
              return next;
            }),
          );
      }
    },
    [me, favs, router, pathname],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/customers/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    setMe(null);
    setFavs({});
    router.refresh();
  }, [router]);

  const value = useMemo<FavoritesContextValue>(
    () => ({ me, ready, isFavorited, toggle, logout }),
    [me, ready, isFavorited, toggle, logout],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
