import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // View Transitions：启用 React <ViewTransition> 的 Next 集成（路由跳转自动触发）。
  // 详见 docs/前端设计规范.md §7：列表↔详情共享封面 morph。
  experimental: {
    viewTransition: true,
  },
  // 前台图片域名白名单：本地上传走相对路径 /api/media/file/*（无需配置）；
  // 部署到 Supabase Storage 时在此追加其 host（M4-3）。
  images: {
    remotePatterns: [
      // { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withPayload(nextConfig);
