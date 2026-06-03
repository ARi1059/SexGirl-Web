import { getAppearance } from "@/lib/site";
import { PageHeader } from "@/components/console/PageHeader";
import { AppearanceForm } from "@/components/console/AppearanceForm";

export const dynamic = "force-dynamic";

// 外观主题 /admin/appearance（server，段内已 requireSuperAdmin）。读当前主题 → 内联切换表单。
export default async function AppearancePage() {
  const { theme } = await getAppearance();
  return (
    <div className="p-7">
      <PageHeader title="外观主题" subtitle="切换前台网站主题，保存后全站立即生效（仅影响前台，不影响后台控制台）" />
      <AppearanceForm initial={theme} />
    </div>
  );
}
