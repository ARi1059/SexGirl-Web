import Link from "next/link";
import { ChevronRight, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/console/PageHeader";

// 公告栏 hub /admin/announcements（门内已 requireSuperAdmin）。
// 两篇公告是单例 Global，故列卡片点进各自编辑页，而非「列表 + 新建」。
const GUIDES = [
  { slug: "app-download-guide", label: "App 下载教学", desc: "图文教程 + 安装包下载按钮", route: "/app-download" },
  { slug: "find-us-guide", label: "如何永久找到我们", desc: "图文说明 + 备用入口链接", route: "/find-us" },
];

export default function AnnouncementsHubPage() {
  return (
    <div className="p-7">
      <PageHeader title="公告栏" subtitle="编辑两篇站点公告；保存后前台立即生效" />
      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/admin/announcements/${g.slug}`}
            className="group flex items-start gap-4 rounded-md border border-line bg-paper p-5 transition-colors hover:border-accent"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
              <Megaphone size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 font-display text-[15px] font-semibold text-ink">
                {g.label}
                <ChevronRight
                  size={15}
                  className="text-ink-subtle transition-transform group-hover:translate-x-0.5"
                />
              </div>
              <p className="mt-1 text-small text-ink-subtle">{g.desc}</p>
              <p className="mt-2 text-[11.5px] text-ink-subtle">前台路径：{g.route}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
