import type { UploadedImage } from "../product-form/upload";

// 公告积木编辑器的本地编辑态（client）—— 判别联合，与 Payload body 积木一一对应。
// 差异：富文本字段压成纯文本（text + complex 标记，见 lib/lexical）；上传字段存 {id,url[,filename]}
// 便于回填预览，提交时只交 id（convert.ts）。临时 key 仅供 React 列表/增删移用，提交丢弃。
//
// ⚠️ 7 种必须全覆盖：Global 存盘是整段 body 覆盖写，少覆盖一种会在「加载 → 保存」时
//    把该块从 body 抹掉（数据丢失）。新增积木类型务必同步本联合 + convert + BlocksEditor。

/** 安装包上传回填态（同 UploadedImage 思路，但带文件名供列表展示）。 */
export type UploadedFile = { id: number; url: string; filename: string };

export type ButtonStyle = "primary" | "secondary" | "outline";
export type CalloutTone = "info" | "warning" | "success";
export type DownloadPlatform = "android" | "ios" | "other";

export type EditBlock =
  | { key: string; blockType: "richText"; text: string; complex: boolean }
  | { key: string; blockType: "image"; image: UploadedImage | null; caption: string }
  | { key: string; blockType: "button"; label: string; url: string; style: ButtonStyle; icon: string }
  | {
      key: string;
      blockType: "step";
      title: string;
      bodyText: string;
      bodyComplex: boolean;
      image: UploadedImage | null;
    }
  | { key: string; blockType: "qrcode"; image: UploadedImage | null; label: string; caption: string }
  | { key: string; blockType: "callout"; tone: CalloutTone; text: string; complex: boolean }
  | {
      key: string;
      blockType: "download";
      file: UploadedFile | null;
      label: string;
      platform: DownloadPlatform;
      version: string;
      note: string;
    };

export type EditBlockType = EditBlock["blockType"];

/** 编辑页 → 表单的扁平初值（可序列化，由 [slug]/page.tsx 服务端算好后跨界传入）。 */
export type AnnouncementFormInitial = {
  title: string;
  intro: string;
  blocks: EditBlock[];
};

/** 各积木类型的中文名（添加面板 + 块头部标题共用）。 */
export const BLOCK_TYPE_LABEL: Record<EditBlockType, string> = {
  richText: "富文本段落",
  image: "图片",
  button: "按钮 / 链接",
  step: "图文步骤",
  qrcode: "二维码",
  callout: "提示框",
  download: "下载按钮",
};
