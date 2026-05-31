'use client'

import { useState } from 'react'
import { Button, toast } from '@payloadcms/ui'

// 「今日可制作」批量重置按钮（开发计划 M4-2），挂在后台 Dashboard 顶部
// （admin.components.beforeDashboard）。点击 → 二次确认 → POST 自定义端点
// /api/reset-available-today（见 src/endpoints/resetAvailableToday.ts）。
//
// 用 Payload 自家 Button + toast(sonner)，与后台 UI 视觉一致；端点走 cookie
// 鉴权，fetch credentials:'include' 带上当前后台会话。成功后端点逐条 update
// 已触发前台 revalidate，无需前端再处理。客户端组件，经 importMap 注册。
export function ResetAvailableTodayButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    if (!window.confirm('确定把所有商品的「今日可制作」清零？此操作不可撤销。')) return

    setLoading(true)
    try {
      const res = await fetch('/api/reset-available-today', {
        method: 'POST',
        credentials: 'include',
      })
      const data: { updated?: number; failed?: number; error?: string } = await res
        .json()
        .catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error ?? `重置失败（${res.status}）`)
        return
      }

      const updated = data.updated ?? 0
      if (data.failed) {
        toast.warning(`已重置 ${updated} 个，${data.failed} 个失败`)
      } else {
        toast.success(updated > 0 ? `已重置 ${updated} 个商品` : '没有需要重置的商品')
      }
    } catch {
      toast.error('网络错误，重置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <Button
        buttonStyle="secondary"
        size="medium"
        onClick={handleClick}
        disabled={loading}
        aria-label="重置今日可制作"
      >
        {loading ? '重置中…' : '重置「今日可制作」'}
      </Button>
    </div>
  )
}
