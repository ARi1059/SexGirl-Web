import React from 'react'

// 登录页品牌字标（admin.components.graphics.Logo），替代 Payload 默认 logo。
// 复用前台「定制商品」serif 字标观感（字体走 --font-serif，见 custom.scss）。
// 无交互 → server 组件；色用 --theme-elevation-1000 自动适配亮/暗主题。
export function BrandLogo() {
  return (
    <div className="brand-logo">
      <span className="brand-logo__word">定制商品</span>
      <span className="brand-logo__sub">管理后台</span>
    </div>
  )
}
