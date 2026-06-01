"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * 客户登录 / 注册共用表单（client，开发计划 M7-5）。开发文档 §7.5：最小可用，用户名 + 密码。
 * - register：POST /api/customers 创建账号，再自动登录。
 * - login：POST /api/customers/login，Payload 下发 httpOnly cookie（credentials:'include'）。
 * 成功后跳 redirect 参数指定页（默认 /me）；用 location 整页跳转，确保 Provider 重新拉取会员态。
 */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/me";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const u = username.trim();
    if (!u || !password) {
      setError("请填写用户名和密码");
      return;
    }
    if (isRegister && password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await fetch("/api/customers", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: u, password, nickname: nickname.trim() || undefined }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j?.errors?.[0]?.message ?? "注册失败，用户名可能已被占用");
          setLoading(false);
          return;
        }
      }

      // 注册后自动登录（同样下发 cookie）。
      const loginRes = await fetch("/api/customers/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password }),
      });
      if (!loginRes.ok) {
        const j = await loginRes.json().catch(() => ({}));
        setError(j?.errors?.[0]?.message ?? "用户名或密码错误");
        setLoading(false);
        return;
      }

      // 整页跳转：让 FavoritesProvider 重新挂载并拉取会员态/收藏。
      window.location.assign(redirect);
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-line bg-paper px-4 py-3 text-body text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-[420px] space-y-4" noValidate>
      <div>
        <label htmlFor="username" className="mb-1.5 block text-overline uppercase text-ink-muted">
          用户名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputCls}
          placeholder="自设用户名"
          required
        />
      </div>

      {isRegister ? (
        <div>
          <label htmlFor="nickname" className="mb-1.5 block text-overline uppercase text-ink-muted">
            昵称（可选）
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={inputCls}
            placeholder="展示名"
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="password" className="mb-1.5 block text-overline uppercase text-ink-muted">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder={isRegister ? "至少 6 位" : "密码"}
          required
        />
      </div>

      {error ? (
        <p role="alert" className="text-small text-accent-strong">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent-strong px-5 py-3 text-overline uppercase text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
      >
        {loading ? "处理中…" : isRegister ? "注册并登录" : "登录"}
      </button>

      <p className="pt-2 text-small text-ink-muted">
        {isRegister ? "已有账号？" : "还没有账号？"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="draw-underline text-ink hover:text-accent"
        >
          {isRegister ? "去登录" : "去注册"}
        </Link>
      </p>
    </form>
  );
}


