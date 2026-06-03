import type { Metadata } from "next";
import { getAppDownloadGuide } from "@/lib/announcements";
import { getSiteSettings, titleWithSuffix } from "@/lib/site";
import { Overline } from "@/components/announce/kit";
import { AnnouncementBody } from "@/components/announce/AnnouncementBody";

// 公告页 /app-download「App 下载教学」。内容来自超管专属 Global app-download-guide，
// 积木由 AnnouncementBody 渲染。ISR：与其余 (site) 页同款静态缓存，配合 Global 的
// afterChange revalidatePath('/app-download') 秒级生效。
export const revalidate = 3600;

const FALLBACK_TITLE = "App 下载教学";

export async function generateMetadata(): Promise<Metadata> {
  const [guide, s] = await Promise.all([getAppDownloadGuide(), getSiteSettings()]);
  return { title: titleWithSuffix(guide?.title?.trim() || FALLBACK_TITLE, s) };
}

export default async function AppDownloadPage() {
  const guide = await getAppDownloadGuide();
  const title = guide?.title?.trim() || FALLBACK_TITLE;

  return (
    <div className="mx-auto max-w-[760px] px-[clamp(20px,5vw,48px)] py-[clamp(48px,8vw,100px)]">
      <header className="border-b-[1.5px] border-line-strong pb-[clamp(28px,5vw,48px)]">
        <Overline>使用指南</Overline>
        <h1 className="mt-3.5 max-w-[560px] font-display text-display-l font-semibold">{title}</h1>
        {guide?.intro ? (
          <p className="mt-5 max-w-[560px] whitespace-pre-line text-body-l leading-relaxed text-ink-muted">
            {guide.intro}
          </p>
        ) : null}
      </header>

      <div className="mt-[clamp(28px,5vw,48px)]">
        <AnnouncementBody body={guide?.body} />
      </div>
    </div>
  );
}
