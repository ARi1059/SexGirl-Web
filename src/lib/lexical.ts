import type { Product } from "@/payload-types";

// 富文本（Lexical）双向工具 —— 自建后台「商品内联编辑」专用（纯函数，server/client 通用）。
// 简化方案：段落级纯文本。textarea 每行 → 一个段落，复刻 seed.ts 的极简 Lexical 结构；
// 回填时从 Lexical 递归提取纯文字。不支持行内格式（粗体/标题/列表）——
// 对在 /cms 设过富格式的描述，内联保存会压平为纯文字（由 isComplexLexical 提示，UI 给警示条）。

export type Lexical = NonNullable<Product["description"]>;

// 遍历用的松散节点形状（Lexical 节点字段繁多，这里只取关心的几个）。
type LexNode = { type?: string; text?: string; format?: number; children?: LexNode[] };

/** textarea 文本 → 极简 Lexical。每非空行一个段落；全空白返回 null（描述选填，与 site 端空判断一致）。 */
export function textToLexical(text: string): Lexical | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: lines.map((t) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        children: [{ type: "text", text: t, format: 0, detail: 0, mode: "normal", style: "", version: 1 }],
      })),
    },
  };
}

/** Lexical → textarea 文本。每个顶层块一行，块内递归拼接 text 节点。复杂结构尽量提取文字（避免内容消失），格式丢失。 */
export function lexicalToText(data: Product["description"] | null | undefined): string {
  const children = (data?.root?.children as LexNode[] | undefined) ?? [];
  const textOf = (node: LexNode): string => {
    if (node.type === "text") return typeof node.text === "string" ? node.text : "";
    if (node.type === "linebreak") return "\n";
    if (Array.isArray(node.children)) return node.children.map(textOf).join("");
    return "";
  };
  return children.map(textOf).join("\n");
}

/** 是否含简化编辑器无法表达的富格式（非段落块 / 行内格式）。用于编辑页警示条，不阻断保存。 */
export function isComplexLexical(data: Product["description"] | null | undefined): boolean {
  const children = (data?.root?.children as LexNode[] | undefined) ?? [];
  let complex = false;
  const walk = (node: LexNode): void => {
    if (complex) return;
    const t = node.type;
    if (t && t !== "root" && t !== "paragraph" && t !== "text" && t !== "linebreak") {
      complex = true; // heading / list / quote / link 等
      return;
    }
    if (t === "text" && typeof node.format === "number" && node.format !== 0) {
      complex = true; // 粗体 / 斜体 / 下划线…
      return;
    }
    node.children?.forEach(walk);
  };
  children.forEach(walk);
  return complex;
}
