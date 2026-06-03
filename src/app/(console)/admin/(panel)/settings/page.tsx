import { DEFAULT_SETTINGS, getSiteSettings } from "@/lib/site";
import { PageHeader } from "@/components/console/PageHeader";
import { SiteSettingsForm } from "@/components/console/SiteSettingsForm";

export const dynamic = "force-dynamic";

// 网站全局设置 /admin/settings（server，门内已 requireAdmin）。读 Global 当前值 → 内联编辑表单。
export default async function SettingsPage() {
  const initial = await getSiteSettings();
  return (
    <div className="p-7">
      <PageHeader title="网站全局设置" subtitle="修改后点击保存，前台立即生效" />
      <SiteSettingsForm initial={initial} defaults={DEFAULT_SETTINGS} />
    </div>
  );
}
