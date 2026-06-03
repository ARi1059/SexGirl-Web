import { getPayloadClient } from "@/lib/payload";
import type { AppDownloadGuide, FindUsGuide } from "@/payload-types";

// 公告栏读取层（server-only：依赖 getPayloadClient → @payload-config）。
// 两个超管专属 Global（globals/announcements.ts）的前台读取入口，对应路由
// /app-download 与 /find-us。read 公开，不受 admin.hidden 影响。
//
// ⚠️ depth:2 是硬要求：body 里 image/qrcode/step.image 是 upload 关系，
//    resolveImage 对「未展开的 number 关系」一律返回 null（media.ts），
//    QrViewer 内部也调 resolveImage —— 用 depth:0 会让所有图与二维码静默消失。
//    depth:2 展开 Media 对象（媒体本身的 sizes 子文档也随之带出）。
//
// 取不到（global 未初始化 / 非请求上下文）返回 null，页面据此只渲染默认 hero。

/** 两个公告 Global 的 body 积木类型一致，取其一作通用别名。 */
export type AnnouncementBlock = NonNullable<AppDownloadGuide["body"]>[number];

/** 读「App 下载教学」Global，depth:2 展开图片关系。失败返回 null。 */
export async function getAppDownloadGuide(): Promise<AppDownloadGuide | null> {
  try {
    const payload = await getPayloadClient();
    return await payload.findGlobal({ slug: "app-download-guide", depth: 2 });
  } catch {
    return null;
  }
}

/** 读「如何永久找到我们」Global，depth:2 展开图片关系。失败返回 null。 */
export async function getFindUsGuide(): Promise<FindUsGuide | null> {
  try {
    const payload = await getPayloadClient();
    return await payload.findGlobal({ slug: "find-us-guide", depth: 2 });
  } catch {
    return null;
  }
}
