import React from 'react'
import type { DefaultServerCellComponentProps } from 'payload'

// 商品列表「封面图」列的自定义单元：渲染缩略图，让列表一眼可辨。
//
// 关键：列表视图固定以 depth:0 取数（@payloadcms/next List 视图），故此处 cellData
// 是 media 的 id（数字），而非填充后的媒体文档 —— 客户端 cell 拿不到 sizes.thumbnail.url。
// 因此必须用 server cell（才有注入的 payload），再按 id 查一次 media 取缩略图地址。
export async function CoverCell({ cellData, payload }: DefaultServerCellComponentProps) {
  const id = cellData as number | string | null | undefined
  if (id == null) return <span className="brand-cover brand-cover--empty">—</span>

  const media = await payload
    .findByID({ collection: 'media', id, depth: 0, disableErrors: true })
    .catch(() => null)

  const m = media as
    | { url?: string | null; alt?: string | null; sizes?: { thumbnail?: { url?: string | null } } }
    | null
  const src = m?.sizes?.thumbnail?.url ?? m?.url
  if (!src) return <span className="brand-cover brand-cover--empty">—</span>

  // eslint-disable-next-line @next/next/no-img-element -- 后台列表小缩略图，无需 next/image
  return <img className="brand-cover" src={src} alt={m?.alt ?? ''} width={40} height={40} loading="lazy" />
}
