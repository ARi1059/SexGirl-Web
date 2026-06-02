"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Eye, Loader2, Save } from "lucide-react";
import type { Category, Contact } from "@/payload-types";
import { textToLexical } from "@/lib/lexical";
import { cn } from "@/lib/utils";
import { FieldLabel, FormCard, SelectField, SideCard, TextField, Toggle } from "./fields";
import { SingleImageUpload } from "./SingleImageUpload";
import { MultiImageUpload } from "./MultiImageUpload";
import { RichTextEditor } from "./RichTextEditor";
import { type EditTag, editToTags, TagsEditor, tagsToEdit } from "./TagsEditor";
import { ContactsPicker } from "./ContactsPicker";
import type { UploadedImage } from "./upload";
import type { ProductFormInitial } from "./types";

// 商品「新建/编辑」表单（client）。同一组件按 mode 分支：create=POST、edit=PATCH/删除。
// 写操作走 Payload REST（cookie 鉴权，服务端 isAdmin 强制），范式同 ProductStatusToggles。
// 图片「先传后存」：子组件上传拿 media id，这里只提交 id。

type Status = "idle" | "saving" | "saved" | "error";

export function ProductForm({
  mode,
  productId,
  initial,
  categories,
  contacts,
}: {
  mode: "create" | "edit";
  productId?: number;
  initial: ProductFormInitial;
  categories: Category[];
  contacts: Contact[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initial.title);
  const [descriptionText, setDescriptionText] = useState(initial.descriptionText);
  const [coverImage, setCoverImage] = useState<UploadedImage | null>(initial.coverImage);
  const [images, setImages] = useState<UploadedImage[]>(initial.images);
  const [published, setPublished] = useState(initial.published);
  const [availableToday, setAvailableToday] = useState(initial.availableToday);
  const [availableTodayText, setAvailableTodayText] = useState(initial.availableTodayText);
  const [statusText, setStatusText] = useState(initial.statusText);
  const [price, setPrice] = useState(initial.price);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [sortOrder, setSortOrder] = useState(initial.sortOrder);
  const [tags, setTags] = useState<EditTag[]>(() => tagsToEdit(initial.tags));
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>(initial.contacts);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; cover?: string; tags?: string }>({});

  const cmsHref = productId ? `/cms/collections/products/${productId}` : undefined;
  const categoryOptions = [
    { label: "（未分类）", value: "" },
    ...categories.map((c) => ({ label: c.name, value: String(c.id) })),
  ];

  function validate() {
    const e: { title?: string; cover?: string; tags?: string } = {};
    if (!title.trim()) e.title = "请填写商品标题";
    if (!coverImage) e.cover = "请上传封面图";
    if (tags.some((t) => !t.label.trim() || (t.blockType === "link" && !t.url.trim()))) {
      e.tags = "请完善标签：文字不能为空，链接需填地址";
    }
    return e;
  }

  function buildBody() {
    return {
      title: title.trim(),
      description: textToLexical(descriptionText),
      coverImage: coverImage?.id ?? null,
      images: images.map((im) => ({ image: im.id })),
      published,
      availableToday,
      availableTodayText: availableTodayText.trim(),
      statusText: statusText.trim(),
      price: price.trim(),
      category: categoryId ? Number(categoryId) : null,
      sortOrder: Number(sortOrder) || 0,
      tags: editToTags(tags),
      contacts: selectedContacts.map((c) => c.id),
    };
  }

  async function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setStatus("error");
      setErrorMsg("请修正标记的字段后再保存");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStatus("saving");
    setErrorMsg(null);
    try {
      const res = await fetch(mode === "create" ? "/api/products" : `/api/products/${productId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.errors?.[0]?.message ?? `保存失败（${res.status}）`);
      }
      if (mode === "create") {
        router.push("/admin/products");
        router.refresh();
      } else {
        setStatus("saved");
        router.refresh();
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "保存失败");
    }
  }

  async function handleDelete() {
    if (!productId) return;
    if (!window.confirm(`确定删除「${title || "此商品"}」？此操作不可撤销。`)) return;
    setStatus("saving");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.errors?.[0]?.message ?? `删除失败（${res.status}）`);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "删除失败");
    }
  }

  const saving = status === "saving";

  return (
    <div className="pb-20">
      {/* 文档头（sticky，贴顶栏下方） */}
      <div className="sticky top-14 z-10 flex h-[52px] items-center gap-3 border-b border-line bg-paper/95 px-6 backdrop-blur">
        <div className="flex flex-1 items-center gap-1.5 text-small">
          <Link href="/admin/products" className="text-ink-muted transition-colors hover:text-accent">
            商品
          </Link>
          <ChevronRight size={13} className="text-ink-subtle" />
          <span className="truncate font-medium text-ink">{title || "新建商品"}</span>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && productId ? (
            <a
              href={`/p/${productId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-small text-ink-muted transition-colors hover:border-ink hover:text-ink"
            >
              <Eye size={13} /> 预览
            </a>
          ) : null}
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
                <Save size={13} /> 保存
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg ? (
        <div className="mx-auto mt-4 max-w-[1280px] px-6">
          <div className="rounded border border-accent-soft bg-accent-soft/50 px-4 py-2.5 text-small text-accent-strong">
            {errorMsg}
          </div>
        </div>
      ) : null}

      {/* 主体 2 列 */}
      <div className="mx-auto grid max-w-[1280px] gap-6 px-6 pt-7 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* 主列 */}
        <div className="flex flex-col gap-6">
          <FormCard>
            <TextField
              label="商品标题"
              required
              placeholder="请输入商品标题…"
              value={title}
              onChange={setTitle}
              error={errors.title}
            />
          </FormCard>

          <FormCard>
            <FieldLabel label="封面图" required />
            <SingleImageUpload value={coverImage} onChange={setCoverImage} />
            {errors.cover ? <p className="mt-2 text-[11.5px] text-accent-strong">{errors.cover}</p> : null}
          </FormCard>

          <FormCard>
            <FieldLabel label="详情多图" desc="支持多张；用 ←/→ 调整顺序" />
            <MultiImageUpload value={images} onChange={setImages} />
          </FormCard>

          <FormCard>
            <RichTextEditor
              value={descriptionText}
              onChange={setDescriptionText}
              complex={initial.descriptionComplex}
              cmsHref={cmsHref}
            />
          </FormCard>

          <FormCard>
            <TagsEditor value={tags} onChange={setTags} />
            {errors.tags ? <p className="mt-2 text-[11.5px] text-accent-strong">{errors.tags}</p> : null}
          </FormCard>
        </div>

        {/* 侧栏 */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-[7.5rem]">
          <SideCard title="发布设置">
            <div className="flex flex-col">
              <Toggle label="上架" desc="勾选后前台可见" checked={published} onChange={setPublished} />
              <Toggle
                label="今日可接单"
                desc="首页显示「今日可接单」标识"
                checked={availableToday}
                onChange={setAvailableToday}
              />
              {availableToday ? (
                <div className="pt-3.5">
                  <TextField
                    label="可接单文案"
                    desc="如：今日可约、今日有号"
                    value={availableTodayText}
                    onChange={setAvailableTodayText}
                  />
                </div>
              ) : null}
              <div className="pt-3.5">
                <TextField
                  label="自定义状态文字"
                  desc="如：已约满、补货中"
                  placeholder="（选填）"
                  value={statusText}
                  onChange={setStatusText}
                />
              </div>
            </div>
          </SideCard>

          <SideCard title="商品信息">
            <div className="flex flex-col gap-3.5">
              <TextField
                label="价格"
                desc="如：¥128，留空不显示"
                placeholder="¥128"
                value={price}
                onChange={setPrice}
              />
              <SelectField
                label="商品类型"
                desc="前台分类页据此筛选"
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
              />
              <TextField
                label="排序权重"
                desc="数值越大越靠前"
                inputMode="numeric"
                value={sortOrder}
                onChange={setSortOrder}
              />
            </div>
          </SideCard>

          <SideCard title="绑定客服">
            <ContactsPicker all={contacts} value={selectedContacts} onChange={setSelectedContacts} />
          </SideCard>

          {mode === "edit" ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded border border-accent-soft px-3.5 py-2 text-small text-accent-strong transition-colors hover:bg-accent-soft disabled:opacity-50"
            >
              删除此商品
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
