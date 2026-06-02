import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Contacts } from './collections/Contacts'
import { Products } from './collections/Products'
import { Categories } from './collections/Categories'
import { Customers } from './collections/Customers'
import { Favorites } from './collections/Favorites'
import { resetAvailableToday } from './endpoints/resetAvailableToday'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// 仅当配置了 S3 凭据（生产 = Supabase Storage）时才接对象存储；
// 本地开发无 S3 env 时，上传走本地磁盘（/media，已 gitignore）。
const hasS3 = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID)

// 正式域名（部署时由 NEXT_PUBLIC_SERVER_URL 注入）。本地不设时回退空串——
// serverURL 为空时 Payload 生成同源相对路径 /api/media/file/*，next/image 当本地图优化、
// 无需 remotePatterns，也避开 Next 16 对解析到私有 IP（localhost）的"远程图"SSRF 拦截。
// 注意：生产必须设成 https 正式域名（非私有 IP），不能带末尾斜杠或路径——CORS/CSRF 按精确字符串匹配 Origin 头。
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || ''

export default buildConfig({
  // 后台面板 / 邮件链接 / 元数据用的绝对地址。Payload 不会自动读 NEXT_PUBLIC_SERVER_URL，必须显式接。
  serverURL,
  // CORS 必须用数组（非 '*'）：只有显式 origin 列表匹配时才发 Access-Control-Allow-Credentials，
  // 这是 /api/reset-available-today 那个 cookie 鉴权端点跨域可用的前提。
  // 若后台与公开站点用不同域名，这里要把每个 origin 都列上。
  cors: [serverURL],
  // csrf 无需显式设：sanitize 会自动把 serverURL push 进 csrf 白名单。
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    // 后台元数据：浏览器标签后缀 + 自定义 favicon（玫瑰底「定」字，见 public/admin-favicon.svg）。
    // MetaConfig 透传 Next 的 Metadata，favicon 走标准 icons 字段。
    meta: {
      titleSuffix: ' · 定制商品后台',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/admin-favicon.svg' }],
    },
    components: {
      // 品牌标识：登录页字标 Logo + 导航 monogram Icon（与前台刊头观感一致）。样式见 (payload)/custom.scss。
      graphics: {
        Logo: '/components/admin/BrandLogo#BrandLogo',
        Icon: '/components/admin/BrandIcon#BrandIcon',
      },
      // Dashboard 顶部：① 品牌数据面板（统计 + 快捷入口）② 「今日可制作」批量重置按钮（开发计划 M4-2）。
      // 路径相对 importMap.baseDir（= src/），#Export 取命名导出。
      // 改动后需跑 `pnpm generate:importmap` 重新填充 admin/importMap.js。
      beforeDashboard: [
        '/components/admin/DashboardStats#DashboardStats',
        '/components/admin/ResetAvailableTodayButton#ResetAvailableTodayButton',
      ],
      // 导航底部「查看前台网站」外链（补齐后台缺失的「返回前台」入口）。
      afterNavLinks: ['/components/admin/ViewSiteNavLink#ViewSiteNavLink'],
    },
  },
  collections: [Products, Categories, Contacts, Media, Customers, Favorites, Users],
  // 自定义 REST 端点：POST /api/reset-available-today（默认挂在 routes.api='/api' 下）。
  endpoints: [resetAvailableToday],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // 运行时连接串走 Supabase 事务池（:6543），由池子保护上游 Postgres 连接数；迁移走直连（见 build:deploy 脚本）。
    // max 默认不设（用 node-postgres 默认 10）——设成 1 会让单次渲染里 Payload 的并发查询互相等连接而死锁
    // （构建期 "Collecting page data" 会卡死）。仅在需要调优时用 DATABASE_POOL_MAX 显式覆盖，且不要低于 2。
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      ...(process.env.DATABASE_POOL_MAX ? { max: Number(process.env.DATABASE_POOL_MAX) } : {}),
    },
  }),
  sharp,
  plugins: hasS3
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET as string,
          // 后台直传对象存储，绕过 Vercel ~4.5MB 请求体上限（否则大图上传会失败）。
          // 默认仅登录用户可拿上传凭据；需在 Supabase bucket 配 CORS 允许本站 origin 的 PUT。
          clientUploads: true,
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION,
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
            },
          },
        }),
      ]
    : [],
})
