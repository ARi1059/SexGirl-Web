'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

// 商品列表布尔字段的彩色「药丸」单元。checkbox 的 cellData 是 boolean，无需取数，
// 故用轻量 client cell 即可。样式见 custom.scss .brand-pill*。

export function PublishedPill({ cellData }: DefaultCellComponentProps) {
  const on = Boolean(cellData)
  return (
    <span className={`brand-pill ${on ? 'brand-pill--on' : 'brand-pill--off'}`}>
      {on ? '已上架' : '未上架'}
    </span>
  )
}

export function AvailableTodayPill({ cellData }: DefaultCellComponentProps) {
  const on = Boolean(cellData)
  return (
    <span className={`brand-pill ${on ? 'brand-pill--accent' : 'brand-pill--off'}`}>
      {on ? '今日可接单' : '—'}
    </span>
  )
}
