// 媒体上传（client）：POST /api/media（multipart，cookie 鉴权，服务端 isAdmin 强制）。
// 「先传后存」——选文件即上传拿 media id，表单保存时只提交 id。
// 注：不要手设 Content-Type，让浏览器带 multipart boundary。

export type UploadedImage = { id: number; url: string };

export async function uploadMedia(file: File): Promise<UploadedImage> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/media", { method: "POST", credentials: "include", body: fd });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.errors?.[0]?.message ?? `上传失败（${res.status}）`);
  }
  const doc = (await res.json())?.doc;
  if (!doc?.id) throw new Error("上传响应缺少图片 ID");
  // 预览优先用 thumbnail/card 小图，回退原图。url 本地为同源相对路径，生产为对象存储绝对地址。
  const url: string = doc.sizes?.thumbnail?.url ?? doc.sizes?.card?.url ?? doc.url ?? "";
  return { id: doc.id, url };
}
