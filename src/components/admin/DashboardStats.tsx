import React from 'react'
import type { Payload } from 'payload'

// 仪表盘顶部品牌数据面板（admin.components.beforeDashboard）。
// beforeDashboard 组件由 Payload 注入 ServerProps（含 payload），故可作 async server
// 组件，直接用注入的 payload 走 Local API 统计 + 提供快捷入口。样式见 custom.scss .brand-dashboard*。
//
// 统计取数失败时（如 DB 抖动）降级为只显示标题与快捷操作，不让整个仪表盘崩。
export async function DashboardStats({ payload }: { payload: Payload }) {
  let cards: { label: string; value: number }[] | null = null
  try {
    const [total, published, today, customers] = await Promise.all([
      payload.count({ collection: 'products' }),
      payload.count({ collection: 'products', where: { published: { equals: true } } }),
      payload.count({ collection: 'products', where: { availableToday: { equals: true } } }),
      payload.count({ collection: 'customers' }),
    ])
    cards = [
      { label: '商品总数', value: total.totalDocs },
      { label: '已上架', value: published.totalDocs },
      { label: '今日可接单', value: today.totalDocs },
      { label: '会员数', value: customers.totalDocs },
    ]
  } catch {
    cards = null
  }

  return (
    <section className="brand-dashboard">
      <div className="brand-dashboard__head">
        <h2 className="brand-dashboard__title">定制商品 · 管理后台</h2>
        <div className="brand-dashboard__actions">
          <a
            className="brand-dashboard__btn brand-dashboard__btn--primary"
            href="/admin/collections/products/create"
          >
            ＋ 新建商品
          </a>
          <a
            className="brand-dashboard__btn"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看前台 ↗
          </a>
        </div>
      </div>

      {cards && (
        <div className="brand-dashboard__stats">
          {cards.map((c) => (
            <div key={c.label} className="brand-dashboard__card">
              <div className="brand-dashboard__value">{c.value}</div>
              <div className="brand-dashboard__label">{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
