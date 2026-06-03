# 部署上线 Runbook

> 本项目支持两条部署路线，**按需选一条**：
>
> - **路线 A · Vercel + Supabase** —— serverless 托管，零运维、自动伸缩、全球 CDN，适合不想碰服务器。见下方 §0–§M5-4。
> - **路线 B · Debian 12 自托管 + Cloudflare** —— 一键脚本 [scripts/deploy-debian12.sh](scripts/deploy-debian12.sh)，单机可控、成本固定，适合自己的 VPS。见文末「路线 B」。

---

## 路线 A · Vercel + Supabase

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

---

## 路线 B · 自托管（Debian 12 + Cloudflare）

> 一键脚本：[scripts/deploy-debian12.sh](scripts/deploy-debian12.sh)。**本地 Postgres + 本地磁盘媒体 + systemd + Nginx + pnpm**，幂等可重跑。
> 与路线 A 的差异：跑在你自己的 VPS 上，成本固定、数据自持，但备份与安全更新需自己负责。

### B-0 · 红线（先看）

- **证书 / DNS 必须先行**：`origin` 模式跑脚本前，先在 Cloudflare 配好域名记录、生成 Origin 证书并传到 VPS——脚本会校验证书文件，缺失直接退出。
- **`NEXT_PUBLIC_SERVER_URL` 留空**：脚本默认留空，媒体走同源相对路径 `/api/media/file/*`，`next/image` 无需 `remotePatterns`、也不触发私有 IP 的 SSRF 拦截。设成域名反而要改 `next.config.ts` 白名单，否则图裂。
- **加密模式设 Full (strict)**：装了 Origin 证书后，Cloudflare 若仍是 **Flexible** 会重定向循环；Full(strict) 才会用并校验源站证书。
- **不暴露源站直连**：用了 Cloudflare 就让流量全走 CF（橙云）。可选用脚本写入的 `/etc/nginx/conf.d/cloudflare-realip.conf` 同款 CF IP 段做防火墙白名单，只放行 CF 回源。
- 同路线 A：**不加 `output: standalone/export`**（破坏 `/api/*`）、**`PAYLOAD_SECRET` 不轮换**（脚本首次生成写入 `.env`，重跑保留）。

### B-1 · VPS 配置建议

- **推荐 2 vCPU / 2GB RAM / 40GB SSD**，Debian 12。1GB 也能跑——脚本检测到内存 <2G 会自动建 2G swap 扛过 `next build`（构建是内存大头，峰值约 1.5–2G）。
- 磁盘占用：`node_modules` ~1.1G + `.next` + Postgres + 媒体（每图存原图 + 3 尺寸，随上传增长，记得预留与备份）。
- 流量：图片站建议套 **Cloudflare CDN**（本路线已用），源站 1TB/月 + 100Mbps 共享带宽即可扛十几万 UV/月。

### B-2 · Cloudflare（DNS + 证书 + 加密模式）

1. **DNS → Records**：裸域 `@` 与 `www` 两条 A 记录都指向 `<VPS_IP>`，**都开橙云（Proxied）**。
2. **SSL/TLS → Origin Server → Create Certificate**：Hostnames 填 `cdsexgirl.com` 与 `*.cdsexgirl.com`，有效期 15 年。复制 **Origin Certificate** 与 **Private Key**（私钥只显示一次）。
3. **SSL/TLS → Overview → Full (strict)**；建议同时开 **Always Use HTTPS**。

### B-3 · 传证书到 VPS

脚本默认读 `/etc/ssl/cloudflare/<APP_NAME>.pem` 与 `.key`（`APP_NAME` 默认 `sexgirl-web`）：

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/sexgirl-web.pem    # 粘贴 Origin Certificate
sudo nano /etc/ssl/cloudflare/sexgirl-web.key    # 粘贴 Private Key
sudo chmod 600 /etc/ssl/cloudflare/sexgirl-web.key
```

### B-4 · 拉代码 + 跑脚本

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/ARi1059/SexGirl-Web.git && cd SexGirl-Web

TLS_MODE=origin DOMAINS="cdsexgirl.com www.cdsexgirl.com" \
  bash scripts/deploy-debian12.sh
```

脚本自动 `sudo` 提权，装 Node 22 / pnpm / Postgres / Nginx，建库、**先 `payload migrate` 再 `next build`**、配 systemd 守护与 Nginx（443 用 Origin 证书 + 非规范域 301 跳转 + CF 真实 IP 恢复）。

- 规范域 = `DOMAINS` 第一个（此处裸域），`www` 自动 301 跳裸域；要反向加 `CANONICAL=www.cdsexgirl.com`。
- 跑完放行防火墙 **80 / 443 / 22**（含云控制台安全组）。

### B-5 · 建超管 + 验证

- 浏览器开 `https://cdsexgirl.com/admin` → **第一个注册账号自动成超管**。
- `www` 应 301 跳裸域；`systemctl status sexgirl-web`；日志 `journalctl -u sexgirl-web -f`。

### B-6 · 常用环境变量（跑脚本时可覆盖）

| 变量 | 默认 | 说明 |
|---|---|---|
| `TLS_MODE` | `none` | `none`(仅HTTP) / `origin`(CF Origin 证书) / `letsencrypt`(certbot 直签) |
| `DOMAINS` | 空 | 空格分隔的域名列表，第一个为规范域 |
| `CANONICAL` | 列表首个 | 规范主域，其余 301 跳到它 |
| `TLS_CERT` `TLS_KEY` | `/etc/ssl/cloudflare/sexgirl-web.{pem,key}` | origin 模式证书 / 私钥路径 |
| `APP_PORT` | `3000` | Node 本机端口（仅 127.0.0.1，Nginx 反代） |
| `NGINX_MAX_BODY` | `64m` | 上传体积上限（无 S3 时上传经 Node） |
| `RUN_SEED` | `0` | `=1` 灌示例数据（会重置 products） |
| `CREATE_SWAP` | `auto` | 内存 <2G 自动建 2G swap |
| `DB_NAME` `DB_USER` `DB_PASS` | 据 APP_NAME / 自动生成 | 本地 Postgres 库名 / 用户 / 密码 |

> `letsencrypt` 模式（或旧参数 `ENABLE_TLS=1`）：用于**不挂 Cloudflare 代理**的场景（域名 DNS only 直连 VPS），需额外 `CERTBOT_EMAIL=`。挂了 CF 橙云请用 `origin`。

### B-7 · 运维

- **升级（日常）**：`bash /opt/sexgirl-web/scripts/upgrade-debian12.sh` —— 增量升级专用脚本（[scripts/upgrade-debian12.sh](scripts/upgrade-debian12.sh)）：自动 `pg_dump` 备份 → `git pull` → `payload migrate` → `next build` → 重启 + HTTP 健康检查。构建在重启前完成，**构建失败旧服务不下线**；结语含一键回滚命令。常用：`GIT_REF=v1.2.0`（升到指定 tag）、`BACKUP=0`（跳过备份）、`FORCE=1`（无新提交也重建）。
- **重做基建 / 改配置**（域名、TLS、端口、换库）：`GIT_PULL=1 bash scripts/deploy-debian12.sh`（幂等可重跑）。
- **备份**：升级脚本已自动备份到 `/opt/sexgirl-web/backups/`（留最近 7 份）；媒体另打包 `/opt/sexgirl-web/media`。
- **证书**：Origin 证书 15 年免维护；CF 边缘证书由 Cloudflare 自动续。

### B-8 · Cloudflare 错误码速查

| 现象 | 原因 / 处理 |
|---|---|
| **521** | 源站 443 未起或防火墙未放行 → `ss -tlnp \| grep 443`、查安全组 |
| **525 / 526** | CF↔源站 TLS 握手失败 → Origin 证书 / 私钥不匹配，或加密模式没设对 |
| 重定向循环 | 加密模式误设 **Flexible** → 改 **Full (strict)** |
| 解析不通 | `dig cdsexgirl.com` 看是否解析到 CF IP；裸域 `@` 记录是否漏配 |

> 迁移与本地的关系见上方「附」节，对自托管同样适用（`build:deploy` 会先 `payload migrate` 再 `next build`）。
