import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/account/AuthForm";
import { MemberBenefits } from "@/components/account/MemberBenefits";

export const metadata: Metadata = { title: "注册 · 定制商品展示" };

// 客户注册页 /register（开发计划 M7-5）。用户名 + 密码，最小可用（开发文档 §7.5）。
export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(20px,5vw,96px)] py-[clamp(48px,8vw,120px)]">
      <header className="border-t-[1.5px] border-line-strong pt-6">
        <p className="text-overline uppercase text-ink-muted">会员</p>
        <h1 className="mt-2 font-display text-display-l font-semibold">注册</h1>
        <p className="mt-3 max-w-[420px] text-body text-ink-muted">
          自设用户名与密码即可收藏心仪商品。浏览全程免登录，仅收藏与个人中心需要账号。
        </p>
      </header>
      {/* 双列：左表单（max 420）/ 右会员专属面板；移动端堆叠。两列各自 mt-8 顶部对齐。 */}
      <div className="grid gap-[clamp(32px,5vw,80px)] md:grid-cols-[minmax(0,420px)_1fr] md:items-start">
        <Suspense fallback={null}>
          <AuthForm mode="register" />
        </Suspense>
        <MemberBenefits className="mt-8" />
      </div>
    </div>
  );
}
