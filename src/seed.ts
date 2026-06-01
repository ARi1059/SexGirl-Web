import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import sharp from 'sharp'

import { getPayloadClient } from '@/lib/payload'
import type { Product } from '@/payload-types'

// 开发种子数据（开发计划 M1-5 超管 + M1-6 示例数据）。
// 运行： pnpm seed  （= payload run src/seed.ts）
// 幂等：每次先清空 products / contacts / media 再重建；用户只在「零用户」时创建。
// 图片为 sharp 生成的占位图，正式素材由管理员在 /admin 上传替换。

type Lexical = NonNullable<Product['description']>
type Tag = NonNullable<Product['tags']>[number]

const TMP = path.join(os.tmpdir(), 'custom-goods-seed')

const escapeXml = (s: string): string =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!)

// 极简 Lexical 富文本：每个字符串 → 一个段落
const richText = (paragraphs: string[]): Lexical => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      textFormat: 0,
      children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    })),
  },
})

// 渐变封面 / 详情占位图（1600×2000，竖版画廊比例）
const gradientJpeg = (title: string, subtitle: string, hue: number): Promise<Buffer> => {
  const w = 1600
  const h = 2000
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},68%,62%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 38) % 360},62%,46%)"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="46%" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="140" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeXml(title)}</text>
    <text x="50%" y="53%" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="66" fill="#ffffffcc" text-anchor="middle">${escapeXml(subtitle)}</text>
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer()
}

// 仿二维码占位图（800×800：三个定位角 + 确定性模块 + 文案）
const qrPng = (label: string, hue: number): Promise<Buffer> => {
  const finder = (x: number, y: number): string =>
    `<rect x="${x}" y="${y}" width="160" height="160" rx="16" fill="#111"/><rect x="${x + 40}" y="${y + 40}" width="80" height="80" rx="8" fill="#fff"/>`
  let modules = ''
  for (let i = 0; i < 200; i++) {
    const gx = ((i * 73 + label.length * 31) % 18) * 36 + 70
    const gy = ((i * 137 + 17) % 16) * 36 + 230
    modules += `<rect x="${gx}" y="${gy}" width="28" height="28" fill="#111"/>`
  }
  const svg = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#fff"/>
    ${modules}
    ${finder(60, 60)}${finder(580, 60)}${finder(60, 580)}
    <rect x="8" y="8" width="784" height="784" fill="none" stroke="hsl(${hue},60%,55%)" stroke-width="16"/>
    <text x="50%" y="775" font-family="sans-serif" font-size="40" fill="#111" text-anchor="middle">${escapeXml(label)}</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

const seed = async (): Promise<void> => {
  const payload = await getPayloadClient()
  await mkdir(TMP, { recursive: true })

  const createMedia = async (buf: Buffer, name: string, alt: string): Promise<number> => {
    const filePath = path.join(TMP, name)
    await writeFile(filePath, buf)
    const doc = await payload.create({ collection: 'media', data: { alt }, filePath })
    return doc.id
  }

  // ── 清理旧数据（顺序：先解除引用方）────────────────────────────────
  // products 引用 categories/contacts/media，故先删 products，再删被引用集合。
  payload.logger.info('🧹 清空 products / categories / contacts / media …')
  await payload.delete({ collection: 'products', where: { id: { greater_than: 0 } } })
  await payload.delete({ collection: 'categories', where: { id: { greater_than: 0 } } })
  await payload.delete({ collection: 'contacts', where: { id: { greater_than: 0 } } })
  await payload.delete({ collection: 'media', where: { id: { greater_than: 0 } } })

  // ── M1-5 超级管理员（首账号经 Users.beforeChange 钩子自动 superadmin）──
  const { totalDocs: userCount } = await payload.count({ collection: 'users' })
  if (userCount === 0) {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
    const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe_123!'
    await payload.create({ collection: 'users', data: { email, password, name: '超级管理员', role: 'superadmin' } })
    payload.logger.info(`👤 已创建超级管理员：${email} / ${password}　（请尽快在 /admin 修改）`)
  } else {
    payload.logger.info(`👤 已存在 ${userCount} 个用户，跳过超管创建`)
  }

  // ── M1-6 客服 ×4：覆盖 wechat / wechatQr / qq / qqQr 全部类型 ────────
  const wechatQrImg = await createMedia(await qrPng('微信扫码', 330), 'qr-wechat.png', '微信二维码')
  const qqQrImg = await createMedia(await qrPng('QQ 扫码', 210), 'qr-qq.png', 'QQ 二维码')

  const wechat = (await payload.create({ collection: 'contacts', data: { type: 'wechat', label: '定制客服·小柔', value: 'studio_rou_2026' } })).id
  const wechatQr = (await payload.create({ collection: 'contacts', data: { type: 'wechatQr', label: '微信扫码咨询', qrImage: wechatQrImg } })).id
  const qq = (await payload.create({ collection: 'contacts', data: { type: 'qq', label: 'QQ 客服·阿玖', value: '800820820' } })).id
  const qqQr = (await payload.create({ collection: 'contacts', data: { type: 'qqQr', label: 'QQ 扫码咨询', qrImage: qqQrImg } })).id
  const all = [wechat, wechatQr, qq, qqQr]
  payload.logger.info('📇 已创建 4 个客服联系方式')

  // ── M6 商品类型 / 分类 ×4（slug 驱动前台 /c/[slug] 与分类导航）─────────
  const categoryDefs = [
    { name: '晚礼服', slug: 'evening-gown', sortOrder: 40 },
    { name: '旗袍', slug: 'qipao', sortOrder: 30 },
    { name: '配饰', slug: 'accessory', sortOrder: 20 },
    { name: '披肩', slug: 'shawl', sortOrder: 10 },
  ]
  const catId: Record<string, number> = {}
  for (const c of categoryDefs) {
    catId[c.slug] = (await payload.create({ collection: 'categories', data: c })).id
  }
  payload.logger.info(`🏷️  已创建 ${categoryDefs.length} 个商品类型`)

  // ── M1-6 商品 ×6：标签覆盖 text/icon/colorBlock/link，状态字段各异 ───
  const specs: {
    title: string
    subtitle: string
    desc: string[]
    hue: number
    published: boolean
    availableToday: boolean
    availableTodayText?: string
    statusText: string
    category: string
    tags: Tag[]
    contacts: number[]
  }[] = [
    {
      title: '星河晚礼裙',
      subtitle: 'Evening Gown',
      hue: 320,
      published: true,
      availableToday: true,
      availableTodayText: '今日可接单',
      statusText: '',
      category: 'evening-gown',
      desc: ['垂坠真丝缎面，星点亮片手工缀钉。', '可按身形定制，工期约 7–10 天。'],
      tags: [
        { blockType: 'text', label: '热销', style: { color: '#ffffff', bg: '#e11d48' } },
        { blockType: 'icon', label: '手工定制', icon: 'Sparkles' },
      ],
      contacts: [wechat, wechatQr],
    },
    {
      title: '蕾丝手作发饰',
      subtitle: 'Hair Accessory',
      hue: 280,
      published: true,
      availableToday: false,
      statusText: '需预约 3 天',
      category: 'accessory',
      desc: ['法式蕾丝叠层，搭配淡水珍珠。', '适合婚礼、写真与日常通勤。'],
      tags: [
        { blockType: 'colorBlock', label: '限量', style: { color: '#ffffff', bg: '#7c3aed' } },
        { blockType: 'link', label: '查看搭配', url: 'https://example.com/lookbook' },
      ],
      contacts: [wechat, qq],
    },
    {
      title: '复古旗袍套装',
      subtitle: 'Qipao',
      hue: 12,
      published: true,
      availableToday: true,
      availableTodayText: '今日可定制',
      statusText: '',
      category: 'qipao',
      desc: ['织锦提花面料，立体盘扣工艺。', '提供量体定制与改良版型。'],
      tags: [
        { blockType: 'icon', label: '高定剪裁', icon: 'Scissors' },
        { blockType: 'colorBlock', label: '春季新款', style: { color: '#ffffff', bg: '#db2777' } },
      ],
      contacts: [wechatQr, qqQr],
    },
    {
      title: '森系刺绣披肩',
      subtitle: 'Embroidered Shawl',
      hue: 150,
      published: true,
      availableToday: false,
      statusText: '已约满',
      category: 'shawl',
      desc: ['羊绒混纺，手工立体刺绣花卉。', '当前档期已满，可预约下一批。'],
      tags: [
        { blockType: 'text', label: '经典', style: { color: '#ffffff', bg: '#0f766e' } },
        { blockType: 'link', label: '面料说明', url: 'https://example.com/fabric' },
      ],
      contacts: [wechat],
    },
    {
      title: '国风团扇礼盒',
      subtitle: 'Folding Fan Set',
      hue: 40,
      published: true,
      availableToday: true,
      availableTodayText: '今日可发货',
      statusText: '',
      category: 'accessory',
      desc: ['真丝绢面手绘，紫檀扇骨。', '附赠礼盒与定制题字服务。'],
      tags: [
        { blockType: 'text', label: '人气', style: { color: '#ffffff', bg: '#d97706' } },
        { blockType: 'icon', label: '匠心', icon: 'Gem' },
        { blockType: 'colorBlock', label: '礼盒装', style: { color: '#1f2937', bg: '#fde68a' } },
        { blockType: 'link', label: '在线预览', url: 'https://example.com/gift' },
      ],
      contacts: all,
    },
    {
      title: '手绘真丝围巾',
      subtitle: 'Silk Scarf',
      hue: 200,
      published: false,
      availableToday: false,
      statusText: '即将上架',
      category: 'accessory',
      desc: ['100% 桑蚕丝，独立插画师手绘稿。', '新系列预告，敬请期待。'],
      tags: [
        { blockType: 'icon', label: '即将上架', icon: 'Clock' },
        { blockType: 'text', label: '预告', style: { color: '#ffffff', bg: '#2563eb' } },
      ],
      contacts: [qq, qqQr],
    },
  ]

  let sortOrder = 100
  for (const [i, s] of specs.entries()) {
    const n = i + 1
    const cover = await createMedia(await gradientJpeg(s.title, s.subtitle, s.hue), `cover-${n}.jpg`, `${s.title} 封面`)
    const detail1 = await createMedia(await gradientJpeg(s.title, '细节 01', (s.hue + 18) % 360), `p${n}-d1.jpg`, `${s.title} 细节图 1`)
    const detail2 = await createMedia(await gradientJpeg(s.title, '细节 02', (s.hue + 36) % 360), `p${n}-d2.jpg`, `${s.title} 细节图 2`)
    await payload.create({
      collection: 'products',
      data: {
        title: s.title,
        description: richText(s.desc),
        coverImage: cover,
        images: [{ image: detail1 }, { image: detail2 }],
        published: s.published,
        availableToday: s.availableToday,
        availableTodayText: s.availableTodayText,
        statusText: s.statusText,
        category: catId[s.category],
        sortOrder,
        tags: s.tags,
        contacts: s.contacts,
      },
    })
    sortOrder -= 10
    payload.logger.info(`🛍️  商品：${s.title}${s.published ? '' : '（草稿）'}`)
  }

  await rm(TMP, { recursive: true, force: true })
  payload.logger.info('🎉 Seed 完成：6 商品 / 4 类型 / 4 客服 / 20 媒体')
}

try {
  await seed()
  process.exit(0)
} catch (err) {
  console.error('Seed 失败：', err)
  process.exit(1)
}
