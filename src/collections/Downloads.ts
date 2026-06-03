import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/roles'

// 安装包上传集合 —— 公告栏「App 下载教学」的下载块（blocks/announcementBlocks.ts 的 download）
// 引用本集合的文件，前台渲染成下载按钮。与 Media 并列，但**专放二进制安装包**（APK / IPA 等）：
//   - 不设 imageSizes / focalPoint：不走 sharp（sharp 会在二进制上失败或产出垃圾）。
//   - 不设 mimeTypes：一旦设了，Payload 会用 file-type 嗅探文件内容，APK/IPA 会被识别成
//     application/zip 而与 vnd.android.package-archive 不匹配遭拒（见 uploads/checkFileRestrictions.js）。
//     内置危险类型黑名单含 jar 但不含 apk/ipa/zip，故用 allowRestrictedFileTypes 短路整套类型校验，
//     真正的写入门由 access（isAdmin）+ 公告编辑页（超管级）把守。
// 存储：生产走 S3（payload.config 的 s3Storage collections.downloads + clientUploads 大文件直传）；
//   本地无 S3 走本地磁盘（staticDir 默认取 slug = /downloads，已随 /media gitignore 习惯处理）。
export const Downloads: CollectionConfig = {
  slug: 'downloads',
  labels: { singular: '安装包', plural: '安装包' },
  admin: { group: '系统' },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  upload: { allowRestrictedFileTypes: true },
  fields: [{ name: 'label', type: 'text', label: '名称（如：安卓版 v2.3）' }],
}
