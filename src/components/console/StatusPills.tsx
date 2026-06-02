// 商品状态药丸（展示型）。语义同 components/admin/BoolPillCell（Payload 列表用），
// 但走前台设计令牌，供自建后台的仪表盘 / 商品列表共用。
// 「今日接单」用 accent-soft/accent-strong 令牌（随 .dark 切换）；「已上架」绿用同色透明底，
// 亮/暗皆可读。

export function PublishedPill({ on }: { on: boolean }) {
  if (on) {
    return (
      <span className="inline-block rounded-full bg-[#6E9E62]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#5d8a52]">
        已上架
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-medium text-ink-subtle">
      草稿
    </span>
  );
}

export function TodayPill() {
  return (
    <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-strong">
      今日接单
    </span>
  );
}
