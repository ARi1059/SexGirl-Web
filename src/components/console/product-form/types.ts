import type { Contact, Product } from "@/payload-types";
import type { UploadedImage } from "./upload";

// 商品表单的扁平初始值（可序列化，从 Server Component 传入 client 表单）。
// 放在无 "use client" 的共享模块，server 页与 client 表单都能 import；
// tags 传原始 blocks 数组，由表单在 client 端经 tagsToEdit 转成编辑态（避免跨 client 边界调用）。
export type ProductFormInitial = {
  title: string;
  descriptionText: string;
  descriptionComplex: boolean;
  coverImage: UploadedImage | null;
  images: UploadedImage[];
  published: boolean;
  availableToday: boolean;
  availableTodayText: string;
  statusText: string;
  price: string;
  categoryId: string;
  sortOrder: string;
  tags: Product["tags"];
  contacts: Contact[];
};

/** 新建页用的空白初始值（与集合 defaultValue 对齐）。 */
export const emptyInitial = (): ProductFormInitial => ({
  title: "",
  descriptionText: "",
  descriptionComplex: false,
  coverImage: null,
  images: [],
  published: false,
  availableToday: false,
  availableTodayText: "今日可接单",
  statusText: "",
  price: "",
  categoryId: "",
  sortOrder: "0",
  tags: null,
  contacts: [],
});
