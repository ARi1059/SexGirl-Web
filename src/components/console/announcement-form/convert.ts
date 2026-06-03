import { resolveImage } from "@/lib/media";
import { isComplexLexical, lexicalToText, textToLexical } from "@/lib/lexical";
import type { AnnouncementBlock } from "@/lib/announcements";
import type { Download, Media } from "@/payload-types";
import type { UploadedImage } from "../product-form/upload";
import type { EditBlock, UploadedFile } from "./types";

// 公告 body 积木 ↔ 本地编辑态 的双向转换（纯函数，server/client 通用）。
//  - blocksToEdit：服务端在 [slug]/page.tsx 用（depth:2 已展开 image/file 为对象 → 取 {id,url}），
//    富文本 Lexical → 纯文本 + complex 标记。
//  - editToBlocks：client 提交时用，去临时 key、上传字段交 id、纯文本 → Lexical、选填空值省略。
// AnnouncementBlock 用 `import type` 引入（@/lib/announcements 是 server-only，类型在编译期擦除，
// 不会把该运行时模块拖进客户端包）。

const toImg = (m: number | Media | null | undefined): UploadedImage | null => {
  if (!m || typeof m === "number") return null;
  return { id: m.id, url: resolveImage(m, "thumbnail")?.url ?? m.url ?? "" };
};

const toFile = (f: number | Download | null | undefined): UploadedFile | null => {
  if (!f || typeof f === "number") return null;
  return { id: f.id, url: f.url ?? "", filename: f.filename ?? "安装包" };
};

// 各富文本字段的内联 Lexical 类型彼此结构等价（均由同一 lexicalEditor 生成），
// 经 unknown 桥接到 lib/lexical 的 Product["description"] 形参，避免逐字段挑剔的类型摩擦。
const lexToText = (v: unknown): string => lexicalToText(v as Parameters<typeof lexicalToText>[0]);
const lexComplex = (v: unknown): boolean => isComplexLexical(v as Parameters<typeof isComplexLexical>[0]);

/** Global body → 本地编辑态（回填）。未知 blockType 跳过（前向兼容；7 种均已覆盖）。 */
export function blocksToEdit(body: AnnouncementBlock[] | null | undefined): EditBlock[] {
  if (!body) return [];
  return body.flatMap((b): EditBlock[] => {
    const key = crypto.randomUUID();
    switch (b.blockType) {
      case "richText":
        return [{ key, blockType: "richText", text: lexToText(b.content), complex: lexComplex(b.content) }];
      case "image":
        return [{ key, blockType: "image", image: toImg(b.image), caption: b.caption ?? "" }];
      case "button":
        return [
          { key, blockType: "button", label: b.label, url: b.url, style: b.style ?? "primary", icon: b.icon ?? "" },
        ];
      case "step":
        return [
          {
            key,
            blockType: "step",
            title: b.title,
            bodyText: lexToText(b.body),
            bodyComplex: lexComplex(b.body),
            image: toImg(b.image),
          },
        ];
      case "qrcode":
        return [{ key, blockType: "qrcode", image: toImg(b.image), label: b.label ?? "", caption: b.caption ?? "" }];
      case "callout":
        return [{ key, blockType: "callout", tone: b.tone ?? "info", text: lexToText(b.content), complex: lexComplex(b.content) }];
      case "download":
        return [
          {
            key,
            blockType: "download",
            file: toFile(b.file),
            label: b.label,
            platform: b.platform ?? "other",
            version: b.version ?? "",
            note: b.note ?? "",
          },
        ];
      default:
        return [];
    }
  });
}

const trimOrUndef = (s: string): string | undefined => s.trim() || undefined;

/** 本地编辑态 → Payload body（提交）。值经 JSON 上送，故用宽松对象数组即可。 */
export function editToBlocks(edit: EditBlock[]): Record<string, unknown>[] {
  return edit.map((b): Record<string, unknown> => {
    switch (b.blockType) {
      case "richText":
        return { blockType: "richText", content: textToLexical(b.text) };
      case "image":
        return { blockType: "image", image: b.image?.id ?? null, caption: trimOrUndef(b.caption) };
      case "button":
        return {
          blockType: "button",
          label: b.label.trim(),
          url: b.url.trim(),
          style: b.style,
          icon: trimOrUndef(b.icon),
        };
      case "step":
        return { blockType: "step", title: b.title.trim(), body: textToLexical(b.bodyText), image: b.image?.id ?? null };
      case "qrcode":
        return {
          blockType: "qrcode",
          image: b.image?.id ?? null,
          label: trimOrUndef(b.label),
          caption: trimOrUndef(b.caption),
        };
      case "callout":
        return { blockType: "callout", tone: b.tone, content: textToLexical(b.text) };
      case "download":
        return {
          blockType: "download",
          file: b.file?.id ?? null,
          label: b.label.trim(),
          platform: b.platform,
          version: trimOrUndef(b.version),
          note: trimOrUndef(b.note),
        };
    }
  });
}
