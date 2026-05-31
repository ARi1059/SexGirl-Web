import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // View Transitions：启用 React <ViewTransition> 的 Next 集成（路由跳转自动触发）。
  // 详见 docs/前端设计规范.md §7：列表↔详情共享封面 morph。
  experimental: {
    viewTransition: true,
  },
  // 图片优化（设计规范 §5）。
  // - 域名白名单 remotePatterns：本地与默认部署下 media.url 是同源相对路径
  //   /api/media/file/*（Payload 代理 S3），next/image 无需白名单即可用。
  //   下面的 Supabase host 是「防御性」配置：仅当未来把文件改为以 Supabase
  //   公共 URL 直出（如 storage 桶设为 public 并绕过 Payload 代理）时才用到，留着无害。
  //   Supabase 对象 URL 形如 https://<ref>.supabase.co/storage/v1/object/public/...
  // - formats：Next 16 默认仅 webp；显式加 avif 让现代浏览器走更优压缩。
  //   质量沿用 Next 16 默认 qualities [75]，组件一律不传 quality（见 M3 笔记）。
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default withPayload(nextConfig);
