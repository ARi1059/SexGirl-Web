import React from 'react'

// 导航底部「查看前台网站」外链（admin.components.afterNavLinks）。
// server 组件；外链新开标签，相对路径 / 在任何域名/环境都正确。
export function ViewSiteNavLink() {
  return (
    <a className="brand-nav-link" href="/" target="_blank" rel="noopener noreferrer">
      查看前台网站 ↗
    </a>
  )
}
