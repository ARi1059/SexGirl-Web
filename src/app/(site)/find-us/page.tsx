import type { Metadata } from "next";
import { getFindUsGuide } from "@/lib/announcements";
import { getSiteSettings, titleWithSuffix } from "@/lib/site";
import { CompassIllustration, Overline } from "@/components/announce/kit";
import { AnnouncementBody } from "@/components/announce/AnnouncementBody";
import { BookmarkButton } from "@/components/announce/BookmarkButton";

// 公告页 /find-us「如何永久找到我们」。内容来自超管专属 Global find-us-guide。
// 指南针与「收藏本页」CTA 是页面级装饰（非积木）；正文积木走 AnnouncementBody。
export const revalidate = 3600;

const FALLBACK_TITLE = "如何永久找到我们";

export async function generateMetadata(): Promise<Metadata> {
  const [guide, s] = await Promise.all([getFindUsGuide(), getSiteSettings()]);
  return { title: titleWithSuffix(guide?.title?.trim() || FALLBACK_TITLE, s) };
}

export default async function FindUsPage() {
  const guide = await getFindUsGuide();
  const title = guide?.title?.trim() || FALLBACK_TITLE;

  return (
    <div className="mx-auto max-w-[760px] px-[clamp(20px,5vw,48px)] py-[clamp(48px,8vw,100px)]">
      <header className="border-b-[1.5px] border-line-strong pb-[clamp(28px,5vw,48px)]">
        <Overline>官方导航</Overline>
        <h1 className="mt-3.5 max-w-[580px] font-display text-display-l font-semibold">{title}</h1>
        {guide?.intro ? (
          <p className="mt-5 max-w-[580px] whitespace-pre-line text-body-l leading-relaxed text-ink-muted">
            {guide.intro}
          </p>
        ) : null}
      </header>

      <div className="mt-[clamp(28px,5vw,48px)]">
        <CompassIllustration />
      </div>

      <div className="mt-[clamp(28px,5vw,48px)]">
        <AnnouncementBody body={guide?.body} />
      </div>

      {/* 收藏本页 CTA —— 私域用户重新找回站点的最后一道保险 */}
      <div className="mt-12 border-t border-line pt-8">
        <BookmarkButton />
      </div>
    </div>
  );
}
