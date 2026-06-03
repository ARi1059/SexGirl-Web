"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel, SideCard, TextField } from "./product-form/fields";
import type { SiteSettingsResolved } from "@/lib/site";

// 网站全局设置编辑表单（client）。复用 product-form/fields 的控件；多行字段用内联 textarea。
// 保存走 Payload Global 的 REST：POST /api/globals/site-settings（cookie 鉴权，服务端 isAdmin 强制）。
// 「恢复默认」仅把表单重置为 defaults（需再点保存才落库）。保存成功 router.refresh() 同步前台。

const textareaBase =
  "w-full resize-y rounded border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-accent focus:ring-2 focus:ring-accent-soft";

function TextareaField({
  label,
  desc,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  desc?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel label={label} desc={desc} />
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={textareaBase}
      />
    </div>
  );
}

type Status = "idle" | "saving" | "saved" | "error";

export function SiteSettingsForm({
  initial,
  defaults,
}: {
  initial: SiteSettingsResolved;
  defaults: SiteSettingsResolved;
}) {
  const router = useRouter();
  const [s, setS] = useState<SiteSettingsResolved>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const set = (key: keyof SiteSettingsResolved) => (v: string) =>
    setS((prev) => ({ ...prev, [key]: v }));

  async function handleSave() {
    setStatus("saving");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/globals/site-settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.errors?.[0]?.message ?? `保存失败（${res.status}）`);
      }
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "保存失败");
    }
  }

  const saving = status === "saving";

  return (
    <div className="max-w-3xl">
      {/* 操作栏 */}
      <div className="mb-5 flex items-center gap-2">
        {errorMsg ? <span className="text-small text-accent-strong">{errorMsg}</span> : null}
        <button
          type="button"
          onClick={() => setS(defaults)}
          className="ml-auto inline-flex items-center gap-1.5 rounded border border-line px-3 py-2 text-small text-ink-muted transition-colors hover:text-ink"
        >
          <RotateCcw size={13} /> 恢复默认
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-4 py-2 text-small font-medium text-white transition-colors disabled:opacity-60",
            status === "saved" ? "bg-[#5d8a52]" : "bg-accent hover:bg-accent-strong",
          )}
        >
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" /> 保存中…
            </>
          ) : status === "saved" ? (
            <>
              <Check size={13} /> 已保存
            </>
          ) : (
            <>
              <Save size={13} /> 保存并发布
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <SideCard title="网站基本信息">
          <div className="flex flex-col gap-4">
            <TextField label="网站名称" desc="导航栏 Logo 与浏览器标题" value={s.siteName} onChange={set("siteName")} />
            <TextField label="网站副标题" value={s.siteSlogan} onChange={set("siteSlogan")} />
            <TextField
              label="网页标题（title）"
              desc="浏览器标签 / SEO 标题；前台各页以「· 此值」为后缀"
              value={s.metaTitle}
              onChange={set("metaTitle")}
            />
            <TextareaField
              label="网页描述（meta description）"
              desc="搜索引擎摘要，建议 80–160 字"
              value={s.metaDesc}
              onChange={set("metaDesc")}
            />
          </div>
        </SideCard>

        <SideCard title="首页画廊">
          <div className="flex flex-col gap-4">
            <TextField label="画廊大标题" value={s.galleryTitle} onChange={set("galleryTitle")} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="商品计数单位" desc="如：款 / 件 / 套" value={s.galleryUnit} onChange={set("galleryUnit")} />
              <TextField label="计数后缀" desc="如「私域专属」" value={s.galleryTagSuffix} onChange={set("galleryTagSuffix")} />
            </div>
          </div>
        </SideCard>

        <SideCard title="联系方式文案">
          <div className="flex flex-col gap-4">
            <TextareaField
              label="联系引导文案"
              desc="商品详情联系区底部；可用 {title} 插入当前商品名"
              value={s.contactHint}
              onChange={set("contactHint")}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="微信号" value={s.wechatId} onChange={set("wechatId")} />
              <TextField label="QQ 号" value={s.qqId} onChange={set("qqId")} />
            </div>
            <p className="text-[11.5px] text-ink-subtle">
              微信 / QQ 为站点级记录；前台联系展示仍以各商品绑定的客服为准（暂不展示这两个字段）。
            </p>
          </div>
        </SideCard>

        <SideCard title="会员页文案">
          <div className="flex flex-col gap-4">
            <TextareaField label="登录页提示" value={s.loginHint} onChange={set("loginHint")} />
            <TextareaField label="注册页说明" value={s.registerHint} onChange={set("registerHint")} />
          </div>
        </SideCard>

        <SideCard title="页脚与后台">
          <div className="flex flex-col gap-4">
            <TextareaField label="页脚文字" value={s.footerText} onChange={set("footerText")} />
            <TextField
              label="后台标题后缀"
              desc="仅记录用途：Payload /cms 标签后缀为构建期静态值，暂不由此动态驱动"
              value={s.adminTitle}
              onChange={set("adminTitle")}
            />
          </div>
        </SideCard>
      </div>
    </div>
  );
}
