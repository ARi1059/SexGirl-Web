"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ExternalLink, Eye, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel, FormCard, TextField } from "../product-form/fields";
import { BlocksEditor } from "./BlocksEditor";
import { editToBlocks } from "./convert";
import type { AnnouncementFormInitial, EditBlock } from "./types";

// 公告编辑表单（client）。仿 product-form/ProductForm：sticky 文档头 + 保存状态机。
// 存盘走 Payload Global REST：POST /api/globals/<slug>（cookie 鉴权，服务端 access.update=isSuperAdmin 强制）。
// 保存成功 router.refresh()；Global 的 afterChange 钩子会 revalidatePath 对应前台页（即时生效）。
// 富文本压平由 BlocksEditor 内的 RichTextArea 按块提示，顶部「高级编辑器」深链 /cms 兜底。

type Status = "idle" | "saving" | "saved" | "error";

const textareaBase =
  "w-full resize-y rounded border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-accent focus:ring-2 focus:ring-accent-soft";

export function AnnouncementForm({
  slug,
  route,
  initial,
}: {
  slug: string;
  route: string;
  initial: AnnouncementFormInitial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [intro, setIntro] = useState(initial.intro);
  const [blocks, setBlocks] = useState<EditBlock[]>(initial.blocks);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cmsHref = `/cms/globals/${slug}`;

  // 必填校验：上传类块要有文件、文本类必填要非空 —— 客户端先拦，避免 Payload 原生 400。
  function validate(): string | null {
    for (const b of blocks) {
      if (b.blockType === "image" && !b.image) return "有「图片」块未上传图片";
      if (b.blockType === "qrcode" && !b.image) return "有「二维码」块未上传图片";
      if (b.blockType === "download" && !b.file) return "有「下载按钮」块未上传安装包";
      if (b.blockType === "download" && !b.label.trim()) return "「下载按钮」块需填按钮文字";
      if (b.blockType === "button" && (!b.label.trim() || !b.url.trim())) return "「按钮 / 链接」块需填文字与链接";
      if (b.blockType === "step" && !b.title.trim()) return "「图文步骤」块需填标题";
    }
    return null;
  }

  function buildBody() {
    return {
      title: title.trim(),
      intro: intro.trim(),
      body: editToBlocks(blocks),
    };
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      setStatus("error");
      setErrorMsg(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStatus("saving");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/globals/${slug}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.errors?.[0]?.message ?? `保存失败（${res.status}）`);
      }
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "保存失败");
    }
  }

  const saving = status === "saving";

  return (
    <div className="pb-20">
      {/* sticky 文档头（贴顶栏下方） */}
      <div className="sticky top-14 z-10 flex h-[52px] items-center gap-3 border-b border-line bg-paper/95 px-6 backdrop-blur">
        <div className="flex flex-1 items-center gap-1.5 text-small">
          <Link href="/admin/announcements" className="text-ink-muted transition-colors hover:text-accent">
            公告栏
          </Link>
          <ChevronRight size={13} className="text-ink-subtle" />
          <span className="truncate font-medium text-ink">{title || "公告"}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={cmsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-small text-ink-muted transition-colors hover:border-ink hover:text-ink"
          >
            <ExternalLink size={13} /> 高级编辑器
          </a>
          <a
            href={route}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-small text-ink-muted transition-colors hover:border-ink hover:text-ink"
          >
            <Eye size={13} /> 预览
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-small font-medium text-white transition-colors disabled:opacity-60",
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
      </div>

      {errorMsg ? (
        <div className="mx-auto mt-4 max-w-[760px] px-6">
          <div className="rounded border border-accent-soft bg-accent-soft/50 px-4 py-2.5 text-small text-accent-strong">
            {errorMsg}
          </div>
        </div>
      ) : null}

      {/* 主体单列窄栏（对齐前台公告页 max-w-[760px]） */}
      <div className="mx-auto max-w-[760px] px-6 pt-7">
        <div className="flex flex-col gap-6">
          <FormCard>
            <TextField label="页面标题" value={title} onChange={setTitle} />
          </FormCard>

          <FormCard>
            <FieldLabel label="导语（可选）" desc="页面顶部简介，可留空" />
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={2}
              className={textareaBase}
            />
          </FormCard>

          <FormCard>
            <FieldLabel label="正文内容" desc="用积木自由拼版：富文本 / 图片 / 按钮 / 图文步骤 / 二维码 / 提示框 / 下载按钮" />
            <BlocksEditor value={blocks} onChange={setBlocks} cmsHref={cmsHref} />
          </FormCard>
        </div>
      </div>
    </div>
  );
}
