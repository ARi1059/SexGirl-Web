import type { UploadedFile } from "./types";

// 安装包上传（client）：POST /api/downloads（multipart，cookie 鉴权，服务端 isAdmin 强制）。
// 同 product-form/upload.ts 的「先传后存」：选文件即上传拿 id，表单保存时只提交 id。
// 注：不要手设 Content-Type，让浏览器带 multipart boundary。
export async function uploadDownload(file: File): Promise<UploadedFile> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/downloads", { method: "POST", credentials: "include", body: fd });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.errors?.[0]?.message ?? `上传失败（${res.status}）`);
  }
  const doc = (await res.json())?.doc;
  if (!doc?.id) throw new Error("上传响应缺少文件 ID");
  return { id: doc.id, url: doc.url ?? "", filename: doc.filename ?? "安装包" };
}
