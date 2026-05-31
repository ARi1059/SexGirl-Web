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
import { resetAvailableToday } from './endpoints/resetAvailableToday'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// 仅当配置了 S3 凭据（生产 = Supabase Storage）时才接对象存储；
// 本地开发无 S3 env 时，上传走本地磁盘（/media，已 gitignore）。
const hasS3 = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      // Dashboard 顶部「今日可制作」批量重置按钮（开发计划 M4-2）。
      // 路径相对 importMap.baseDir（= src/），#ResetAvailableTodayButton 取命名导出。
      // 改动后需跑 `pnpm generate:importmap` 重新填充 admin/importMap.js。
      beforeDashboard: ['/components/admin/ResetAvailableTodayButton#ResetAvailableTodayButton'],
    },
  },
  collections: [Products, Contacts, Media, Users],
  // 自定义 REST 端点：POST /api/reset-available-today（默认挂在 routes.api='/api' 下）。
  endpoints: [resetAvailableToday],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
  }),
  sharp,
  plugins: hasS3
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET as string,
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
