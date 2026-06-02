import type { LucideIcon } from "lucide-react";

export type Stat = { label: string; value: number; icon: LucideIcon; color: string };

/**
 * 仪表盘统计卡（展示型 server 组件）。大号 serif 数字 + 标签 + 右上彩色图标芯片。
 * 4 张卡的辅色（玫瑰/蓝/绿/紫）是后台专属点缀色，不在全站令牌内 —— 故就地用固定色值，
 * 芯片底用同色 12% 透明度，亮/暗模式下都成立（无需各配一套）。
 */
export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-xl border border-line bg-paper p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-[32px] font-semibold leading-none text-ink">
                {value}
              </div>
              <div className="mt-2 text-small text-ink-subtle">{label}</div>
            </div>
            <div
              className="grid size-9 place-items-center rounded-[10px]"
              style={{ background: `${color}1F` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
