import type { ReactNode } from "react";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { AnnouncementBlock } from "@/lib/announcements";
import { AnnounceImage, Btn, Callout, DownloadBtn, Step } from "./kit";
import { QrCard } from "./QrCard";

// 公告正文分发器（server）：读 Global 的 body 积木数组，按 blockType 渲染对应基元。
// 连续同类积木会成组：button / download → 横排、qrcode → 响应式网格、step → 编号列表
//（步骤序号 01/02… 跨组连续计数，只数 step）。未知 blockType 走 null 降级（前向兼容）。
// 顶层各组之间用 space-y-12 撑出节奏；step 组内各步骤自带发丝线 + 内边距，不再叠间距。

type ButtonB = Extract<AnnouncementBlock, { blockType: "button" }>;
type QrB = Extract<AnnouncementBlock, { blockType: "qrcode" }>;
type StepB = Extract<AnnouncementBlock, { blockType: "step" }>;
type DownloadB = Extract<AnnouncementBlock, { blockType: "download" }>;

export function AnnouncementBody({ body }: { body?: AnnouncementBlock[] | null }) {
  if (!body?.length) return null;

  const groups: ReactNode[] = [];
  let stepNo = 0; // step 全局序号，跨组连续
  let i = 0;

  while (i < body.length) {
    const block = body[i];
    const key = block.id ?? `b${i}`;

    // 连续 button → CTA 横排（移动端竖排，≥580 横向换行）
    if (block.blockType === "button") {
      const run: ButtonB[] = [];
      while (i < body.length && body[i].blockType === "button") {
        run.push(body[i] as ButtonB);
        i++;
      }
      groups.push(
        <div key={key} className="flex flex-col gap-3 min-[580px]:flex-row min-[580px]:flex-wrap">
          {run.map((b, j) => (
            <Btn key={b.id ?? j} label={b.label} url={b.url} style={b.style} icon={b.icon} size="lg" />
          ))}
        </div>,
      );
      continue;
    }

    // 连续 download → 下载按钮横排（移动端竖排，≥580 横向换行）
    if (block.blockType === "download") {
      const run: DownloadB[] = [];
      while (i < body.length && body[i].blockType === "download") {
        run.push(body[i] as DownloadB);
        i++;
      }
      groups.push(
        <div key={key} className="flex flex-col gap-3 min-[580px]:flex-row min-[580px]:flex-wrap">
          {run.map((b, j) => (
            <DownloadBtn
              key={b.id ?? j}
              file={b.file}
              label={b.label}
              platform={b.platform}
              version={b.version}
              note={b.note}
            />
          ))}
        </div>,
      );
      continue;
    }

    // 连续 qrcode → 1/2/3 列响应式网格
    if (block.blockType === "qrcode") {
      const run: QrB[] = [];
      while (i < body.length && body[i].blockType === "qrcode") {
        run.push(body[i] as QrB);
        i++;
      }
      groups.push(
        <div key={key} className="grid grid-cols-1 gap-5 min-[580px]:grid-cols-2 min-[860px]:grid-cols-3">
          {run.map((b, j) => (
            <QrCard key={b.id ?? j} image={b.image} label={b.label} caption={b.caption} />
          ))}
        </div>,
      );
      continue;
    }

    // 连续 step → 编号列表（步骤自带顶部发丝线与内边距）
    if (block.blockType === "step") {
      const run: StepB[] = [];
      while (i < body.length && body[i].blockType === "step") {
        run.push(body[i] as StepB);
        i++;
      }
      groups.push(
        <div key={key}>
          {run.map((b, j) => {
            stepNo += 1;
            return <Step key={b.id ?? j} number={stepNo} title={b.title} body={b.body} image={b.image} />;
          })}
        </div>,
      );
      continue;
    }

    // 单块
    if (block.blockType === "richText") {
      groups.push(
        block.content ? <RichText key={key} data={block.content} className="richtext" /> : null,
      );
    } else if (block.blockType === "image") {
      groups.push(<AnnounceImage key={key} image={block.image} caption={block.caption} />);
    } else if (block.blockType === "callout") {
      groups.push(<Callout key={key} tone={block.tone} content={block.content} />);
    }
    // 未知类型：忽略
    i += 1;
  }

  return <div className="space-y-12">{groups}</div>;
}
