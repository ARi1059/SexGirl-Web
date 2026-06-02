import { createElement } from "react";
import {
  Sparkles,
  Scissors,
  Gem,
  Clock,
  Heart,
  Star,
  Crown,
  Flame,
  Tag,
  type LucideProps,
  type LucideIcon,
} from "lucide-react";

/**
 * 标签图标白名单：把后台存的字符串图标名映射到 Lucide 组件。
 * 仅放行已知图标，避免把任意字符串当组件名注入；未知名走 null 降级。
 * 覆盖 seed 用到的 Sparkles/Scissors/Gem/Clock，并预留常用款。
 */
const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Scissors,
  Gem,
  Clock,
  Heart,
  Star,
  Crown,
  Flame,
  Tag,
};

/** 标签编辑器图标下拉用的白名单名列表（与 ICONS 单一来源同步）。 */
export const ICON_NAMES = Object.keys(ICONS);

/**
 * 模块级图标组件：按名查表后用 createElement 渲染。
 * 在此封装而非在 render 里把查表结果当 JSX 标签用，避免 React Compiler
 * 的 static-components 规则误判「render 期创建组件」。未知图标渲染 null。
 */
export function LucideGlyph({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return createElement(Icon, props);
}
