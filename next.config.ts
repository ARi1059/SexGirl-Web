import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 前台图片域名白名单：部署到 Supabase Storage 时在此追加其 host
  images: {
    remotePatterns: [
      // { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withPayload(nextConfig);
