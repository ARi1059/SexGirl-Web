// 公告页骨架（hero 形）——覆盖组级画廊骨架，避免文本页加载时闪现 3:4 卡片网格。
export default function Loading() {
  return (
    <div className="mx-auto max-w-[760px] px-[clamp(20px,5vw,48px)] py-[clamp(48px,8vw,100px)]">
      <div className="border-b-[1.5px] border-line-strong pb-[clamp(28px,5vw,48px)]">
        <div className="h-3 w-20 animate-pulse bg-line motion-reduce:animate-none" />
        <div className="mt-4 h-10 w-2/3 animate-pulse bg-line motion-reduce:animate-none" />
        <div className="mt-5 h-4 w-full max-w-[480px] animate-pulse bg-line motion-reduce:animate-none" />
      </div>
      <div className="mt-12 aspect-[21/9] w-full animate-pulse bg-surface motion-reduce:animate-none" />
      <div className="mt-12 space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 w-full animate-pulse bg-surface motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
