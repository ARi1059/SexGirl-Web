import { cn } from "@/lib/utils";

const BENEFITS = [
  "收藏心仪款式，随时回看",
  "个人中心一键管理收藏",
  "无需注册即可浏览全部商品",
];

/**
 * 登录 / 注册页右侧「会员专属」权益面板（server，UI Style Redesign v2）。
 * 纯展示、可静态预渲染，登录/注册两页复用。桌面左描边分隔，移动端堆叠在表单下方。
 */
export function MemberBenefits({ className }: { className?: string }) {
  return (
    <aside className={cn("md:border-l md:border-line md:pl-[clamp(24px,3vw,48px)]", className)}>
      <p className="mb-2.5 text-overline uppercase text-ink-muted">会员专属</p>
      <ul>
        {BENEFITS.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2.5 border-b border-line py-2.5 text-small text-ink-muted"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}
