"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

/**
 * 管理员登录表单（client）。镜像 components/account/AuthForm 对 customers 的写法，
 * 但打 Payload 内置 users 鉴权端点：POST /api/users/login（email + password —— users
 * 集合用默认邮箱登录，区别于 customers 的用户名登录）。成功后 Payload 下发 httpOnly
 * cookie，整页跳转到目标页，让服务端鉴权门 requireAdmin 在新会话下重新校验。
 */
export function LoginForm() {
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    const mail = email.trim();
    if (!mail || !password) {
      setError("请填写邮箱和密码");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.errors?.[0]?.message ?? "邮箱或密码错误");
        setLoading(false);
        return;
      }
      // 整页跳转：确保受保护区在新会话 cookie 下重新做服务端鉴权。
      window.location.assign(redirect);
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-small text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";

  return (
    <div className="w-full max-w-[380px] rounded-2xl border border-line bg-paper p-9 shadow-[0_12px_40px_rgba(33,28,25,0.08)]">
      {/* 品牌字标（与前台刊头 / Payload 后台 BrandLogo 观感一致）*/}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3.5 grid size-12 place-items-center rounded-[14px] bg-accent font-display text-[22px] font-bold text-on-accent">
          定
        </div>
        <div className="font-display text-[22px] font-semibold tracking-[0.04em] text-ink">
          定制商品
        </div>
        <div className="mt-1 text-[11px] tracking-[0.28em] text-ink-subtle">管理后台</div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-overline uppercase text-ink-muted">
            邮箱地址
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className={inputCls}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-overline uppercase text-ink-muted">
            密码
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputCls} pr-10`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? "隐藏密码" : "显示密码"}
              className="absolute right-3 top-1/2 grid -translate-y-1/2 place-items-center text-ink-subtle transition-colors hover:text-ink-muted"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-small text-accent-strong">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-lg bg-accent px-5 py-2.5 text-small font-medium text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        >
          {loading ? "登录中…" : "登录"}
        </button>
      </form>

      <p className="mt-6 text-center text-[11.5px] text-ink-subtle">仅限授权管理员登录</p>
    </div>
  );
}
