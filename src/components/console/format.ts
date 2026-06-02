// 后台列表统一日期格式（zh-CN，YYYY/MM/DD）。缺失 / 非法日期回退占位符。
export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}
