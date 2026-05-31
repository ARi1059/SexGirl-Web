// 前台路由组加载骨架（开发计划 M3-4 防 CLS）。比例与画廊一致，避免布局抖动。
// 轻微 pulse 提示加载；尊重 prefers-reduced-motion（motion-reduce:animate-none）。
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(20px,5vw,96px)] py-[clamp(48px,8vw,120px)]">
      <div className="mb-[clamp(32px,5vw,64px)] border-t-[1.5px] border-line-strong pt-6">
        <div className="h-9 w-40 animate-pulse bg-surface motion-reduce:animate-none" />
      </div>
      <ul className="gallery">
        {Array.from({ length: 6 }).map((_, i) => {
          const feature = (i + 1) % 5 === 0;
          return (
            <li key={i} className={feature ? "card card--feature" : "card"}>
              <div
                className={`animate-pulse bg-surface motion-reduce:animate-none ${
                  feature ? "aspect-[16/10]" : "aspect-[3/4]"
                }`}
              />
              <div className="mt-4 border-t border-line pt-4">
                <div className="h-3 w-24 animate-pulse bg-surface motion-reduce:animate-none" />
                <div className="mt-2 h-6 w-3/4 animate-pulse bg-surface motion-reduce:animate-none" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
