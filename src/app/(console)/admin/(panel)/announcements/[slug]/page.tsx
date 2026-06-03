import { notFound } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import { blocksToEdit } from "@/components/console/announcement-form/convert";
import { AnnouncementForm } from "@/components/console/announcement-form/AnnouncementForm";
import type { AnnouncementFormInitial } from "@/components/console/announcement-form/types";
import type { AnnouncementBlock } from "@/lib/announcements";

export const dynamic = "force-dynamic";

// 公告编辑页 /admin/announcements/[slug]（server，门内已 requireSuperAdmin）。
// 白名单两个 Global → findGlobal(depth:2) 展开 image/file 关系 → blocksToEdit 在**服务端**算出
// 扁平初值（把 Media/Download 文档留在服务端，不下发客户端）→ 内联表单（仿 products/[id]）。
const ROUTE: Record<string, string> = {
  "app-download-guide": "/app-download",
  "find-us-guide": "/find-us",
};

export default async function EditAnnouncementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // Next 16：params 为异步
  const route = ROUTE[slug];
  if (!route) notFound();

  const payload = await getPayloadClient();
  const guide = await payload.findGlobal({
    slug: slug as "app-download-guide" | "find-us-guide",
    depth: 2,
  });

  const initial: AnnouncementFormInitial = {
    title: guide.title ?? "",
    intro: guide.intro ?? "",
    blocks: blocksToEdit(guide.body as AnnouncementBlock[] | null | undefined),
  };

  return <AnnouncementForm slug={slug} route={route} initial={initial} />;
}
