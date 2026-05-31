# 部署上线 Runbook（M5）

> 平台：**Vercel**（Next 16 + Payload serverless）+ **Supabase**（Postgres + Storage）。
> 配套：[开发计划.md](开发计划.md) M5、[开发文档.md](开发文档.md) §9.2。
>
> **代码侧已就绪**（serverURL/CORS、构建期迁移、连接池、clientUploads、Node 锁版本、`vercel.json`）。
> 本文是**你需要在 Supabase / Vercel 控制台执行**的步骤——这些需要账号与凭据，无法由代码完成。

---

## 0. 红线（先看，违反会出事）

- **绝不用 `next dev` / 本地连接生产库**：dev 模式会向库里 push schema，污染 `payload-migrations` 表，导致之后 `payload migrate` 在非交互的 Vercel 构建里卡住。本地开发用本地 Postgres。
- **`PAYLOAD_SECRET` 一次生成、永不轮换**：它签发后台 JWT，换了会让所有管理员会话失效。生产用 `openssl rand -base64 32` 生成一次，存进 Vercel，别动。
- **`NEXT_PUBLIC_SERVER_URL` 不带末尾斜杠**：CORS/CSRF 精确匹配 Origin 头，带 `/` 会静默 401/跨域失败。
- **不要给 `next.config.ts` 加 `output: standalone/export`**：会破坏 Payload 的 `/api/*` 路由。

---

## M5-1 · Supabase（数据库 + 存储）

1. 建项目（选离用户最近的 region）。等 Postgres 就绪。
2. **拿两个连接串**（Project → Connect）：
   - **Transaction pooler**（端口 `6543`）→ 运行时用，填 `DATABASE_URI`。
   - **Direct connection**（端口 `5432`）→ 迁移用，填 `DATABASE_URI_DIRECT`。
   - 两个串都确保含 `?sslmode=require`（Supabase 复制出来通常已带）；若 pooler 报自签证书错，回退用 direct 串临时跑。
3. **Storage** → 新建 bucket，名字与 `S3_BUCKET` 一致（默认 `media`）。
4. **S3 凭据**：Storage → Settings → S3 connection，拿 `S3_ENDPOINT` / `S3_REGION` / access key / secret。
5. **bucket CORS**（clientUploads 必需，否则后台大图上传报 CORS 错）：给 bucket 配置允许你站点 origin 的 `PUT`（与 `GET`/`HEAD`）。origin 用正式域名（同 `NEXT_PUBLIC_SERVER_URL`）。

> 为什么分两个串：事务池适合 serverless 高并发短连接，但不适合迁移的多语句 DDL / 顾问锁；直连适合迁移但 serverless 下会耗尽连接。`build:deploy` 脚本让 `payload migrate` 走 `DATABASE_URI_DIRECT`、`next build` 与运行时走 `DATABASE_URI`。

---

## M5-2 · Vercel（项目 + 环境变量）

1. Import 这个 Git 仓库。框架 Vercel 自动识别为 Next，**无需**改 Build Command——`vercel.json` 已把它指向 `pnpm run build:deploy`（先迁移后构建）。
2. **环境变量**（Production，全部必填除非注明）：

   | 变量 | 值 | 说明 |
   |---|---|---|
   | `DATABASE_URI` | 事务池串（:6543） | 运行时 |
   | `DATABASE_URI_DIRECT` | 直连串（:5432） | 仅迁移 |
   | `DATABASE_POOL_MAX` | 留空（或 ≥2） | 连接池上限；**勿设 1**（会死锁），默认 10 已够 |
   | `PAYLOAD_SECRET` | `openssl rand -base64 32` | 永不轮换 |
   | `NEXT_PUBLIC_SERVER_URL` | 正式域名，无末尾斜杠 | CORS/CSRF/后台 |
   | `S3_ENDPOINT` `S3_REGION` `S3_BUCKET` | Supabase Storage | 对象存储 |
   | `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY` | Supabase S3 凭据 | 对象存储 |

3. Node 版本由 `package.json` 的 `engines.node`（22.x）锁定；如 Vercel 项目设置另有指定，确保 ≥20.9。
4. 首次部署：构建日志应出现 `payload migrate` 应用 `20260531_125639_initial` 后再 `next build`。
   - 若域名是部署后才确定的，定好正式域名 → 更新 `NEXT_PUBLIC_SERVER_URL` 与 bucket CORS origin → 再 redeploy。

---

## M5-3 · 线上首个超管

部署成功后访问 `https://<域名>/admin`：首次无用户 → 进入 create-first-user。
**第一个注册的账号自动成为 superadmin**（`src/collections/Users.ts` 的 `beforeChange` hook，`totalDocs===0` 时置 `role=superadmin`），此后建号需超管授权。
登录后建议立刻：建第二个超管做冗余、把示例账号密码改掉（若跑过 seed）。

---

## M5-4 · 验收清单（对照开发文档 §9.2）

- [ ] **全球访问速度**：列表页 `/`、详情 `/p/[id]` 走 CDN/ISR，首屏快。
- [ ] **即时生效**：后台改某商品 `published` / `statusText` / `availableToday` → 前台秒级刷新（revalidatePath）。
- [ ] **今日可制作批量重置**：Dashboard 顶部按钮一键清零，前台对应商品状态同步变化。
- [ ] **联系方式交互**：微信号一键复制（含「已复制」反馈）、二维码放大 + 长按保存、QQ `mqqwpa://` 唤起。
- [ ] **权限边界**：普通管理员进得了 `/admin`、只能改自己、改不了别人 role、建不了号；超管可全管。
- [ ] **图片**：前台 Network 面板见多尺寸 srcset + AVIF/WebP；后台上传 >4.5MB 大图经 clientUploads 成功（不再 413）。
- [ ] **媒体可访问**：详情多图与二维码均正常加载（`/api/media/file/*` 或 Supabase 公共 URL）。

---

## 附：迁移与本地的关系

- 改了集合 schema 后：本地 `pnpm payload migrate:create <名>` 生成新迁移并提交进仓库；下次 Vercel 构建 `build:deploy` 会自动应用。
- 迁移文件按目录被读取（`src/migrations/*.ts`，`index.ts` 除外），无需手动登记。
- 本地构建冒烟用 `pnpm build`（纯 `next build`，不碰数据库）；`build:deploy` 仅供 Vercel/带库环境。
