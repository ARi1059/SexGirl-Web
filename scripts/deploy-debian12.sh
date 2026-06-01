#!/usr/bin/env bash
#
# Debian 12 (bookworm) 一键自托管部署脚本
# ──────────────────────────────────────────────────────────────────────────
# 适用：单机自托管本项目（Next.js 16 + Payload 3，本地 Postgres + 本地磁盘媒体）。
# 与 DEPLOY.md 的区别：DEPLOY.md 面向 Vercel + Supabase（serverless + 托管库 + S3）；
# 本脚本面向「一台自己的 Debian 12 服务器」，用本地 Postgres、本地磁盘存媒体、
# systemd 守护 next start、Nginx 反代。两条路互不冲突。
#
# 它会做这些事（全部幂等，可重复运行）：
#   1) 装系统依赖：Node 22(NodeSource)、pnpm(corepack)、PostgreSQL、Nginx、git 等
#   2) 建 Postgres 角色 + 数据库（密码自动生成）
#   3) 建专用运行用户、把代码放到 $APP_DIR
#   4) 生成 .env（PAYLOAD_SECRET 一次性生成后保留不变）
#   5) pnpm install + pnpm run build:deploy（先 payload migrate 建表，再 next build）
#   6) 配 systemd 服务（开机自启、崩溃重启、ISR 缓存可写）
#   7) 配 Nginx 反代到 127.0.0.1:PORT（放开上传体积上限），可选 certbot 上 HTTPS
#
# 用法（在服务器上，以能 sudo 的普通用户执行；脚本会自动 sudo 提权）：
#   # 方式 A：先把代码弄到服务器（git clone / scp），进目录直接跑：
#   bash scripts/deploy-debian12.sh
#
#   # 方式 B：覆盖配置（环境变量都可选，下面是常用项）：
#   DOMAIN=shop.example.com ENABLE_TLS=1 CERTBOT_EMAIL=me@example.com \
#     bash scripts/deploy-debian12.sh
#
# 常用可覆盖变量（均有默认值）：
#   APP_NAME       应用名，用于服务名/库名/目录名         默认 sexgirl-web
#   APP_DIR        部署目录                                默认 /opt/$APP_NAME
#   APP_PORT       Node 监听端口（仅本机，Nginx 反代）    默认 3000
#   DOMAIN         Nginx server_name（域名或 IP）          默认 _（任意 Host）
#   SERVER_URL     NEXT_PUBLIC_SERVER_URL                  默认空（媒体走相对路径，最稳）
#   ENABLE_TLS     =1 且 DOMAIN 为真域名时用 certbot 签证书 默认 0
#   CERTBOT_EMAIL  certbot 注册邮箱（ENABLE_TLS=1 时必填）
#   DB_NAME/DB_USER/DB_PASS  Postgres 库名/用户/密码        默认据 APP_NAME，密码自动生成
#   REPO_URL       远程仓库（仅当 $APP_DIR 无代码时克隆）  默认本仓库 origin
#   GIT_REF        克隆后切到的分支/标签                   默认当前默认分支
#   RUN_SEED       =1 跑示例数据 seed（会清空 products）   默认 0
#   NGINX_MAX_BODY 上传体积上限                            默认 64m
#   CREATE_SWAP    auto|1|0，内存<2G 时建 2G swap          默认 auto
#
# ⚠ 注意：
#   - SERVER_URL 默认留空。若你把它设成正式域名，媒体 URL 会变成绝对地址，
#     next/image 需要该域名在 next.config.ts 的 images.remotePatterns 里，否则图裂。
#     单机自托管建议保持留空（媒体走同源相对路径 /api/media/file/*）。
#   - 首个超管：部署成功后访问 http(s)://<域名>/admin，第一个注册的账号自动成为超管。
#
set -euo pipefail

# ── 自动提权：非 root 时用 sudo 重跑自身，-E 保留你传入的环境变量覆盖 ────────────
if [ "$(id -u)" -ne 0 ]; then
  exec sudo -E bash "$0" "$@"
fi

# ── 可配置项（环境变量覆盖；未设则用默认）────────────────────────────────────
APP_NAME="${APP_NAME:-sexgirl-web}"
APP_USER="${APP_USER:-$APP_NAME}"
APP_DIR="${APP_DIR:-/opt/$APP_NAME}"
APP_PORT="${APP_PORT:-3000}"
NODE_MAJOR="${NODE_MAJOR:-22}"
# Postgres 标识符不能含连字符，APP_NAME 里的 - 一律换成 _
DB_NAME="${DB_NAME:-${APP_NAME//-/_}}"
DB_USER="${DB_USER:-${APP_NAME//-/_}}"
DB_PASS="${DB_PASS:-}"                 # 留空则自动生成（或从已存在的 .env 复用）
DB_HOST="127.0.0.1"
DB_PORT="5432"
REPO_URL="${REPO_URL:-https://github.com/ARi1059/SexGirl-Web.git}"
GIT_REF="${GIT_REF:-}"
GIT_PULL="${GIT_PULL:-0}"              # 就地部署时是否先 git pull
DOMAIN="${DOMAIN:-}"
SERVER_URL="${SERVER_URL-}"            # 注意用 - 不用 :- ，允许显式空值
ENABLE_TLS="${ENABLE_TLS:-0}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
NGINX_MAX_BODY="${NGINX_MAX_BODY:-64m}"
CREATE_SWAP="${CREATE_SWAP:-auto}"
RUN_SEED="${RUN_SEED:-0}"

ENV_FILE="$APP_DIR/.env"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"
export DEBIAN_FRONTEND=noninteractive

# ── 日志小工具 ───────────────────────────────────────────────────────────────
c_blue='\033[1;34m'; c_green='\033[1;32m'; c_yellow='\033[1;33m'; c_red='\033[1;31m'; c_off='\033[0m'
step() { echo -e "\n${c_blue}▸ $*${c_off}"; }
info() { echo -e "  ${c_green}✓${c_off} $*"; }
warn() { echo -e "  ${c_yellow}!${c_off} $*"; }
die()  { echo -e "${c_red}✗ $*${c_off}" >&2; exit 1; }

# 从一个 .env 文件读某个 KEY 的值（去掉首个 = 之前的部分）。读不到回显空。
env_get() { [ -f "$ENV_FILE" ] && sed -n "s/^$1=//p" "$ENV_FILE" | head -n1 || true; }

# ── 0. 校验 + swap ───────────────────────────────────────────────────────────
[ -f /etc/debian_version ] || warn "未检测到 Debian，脚本针对 Debian 12 编写，其它发行版可能需调整。"
if [ "$ENABLE_TLS" = "1" ]; then
  [ -n "$DOMAIN" ] || die "ENABLE_TLS=1 需要同时设 DOMAIN（真实域名，且已解析到本机）。"
  [ -n "$CERTBOT_EMAIL" ] || die "ENABLE_TLS=1 需要同时设 CERTBOT_EMAIL。"
  case "$DOMAIN" in *[a-zA-Z]*) : ;; *) die "ENABLE_TLS=1 的 DOMAIN 必须是域名，不能是纯 IP。" ;; esac
fi

maybe_swap() {
  step "检查内存 / swap"
  local mem_kb; mem_kb="$(awk '/MemTotal/{print $2}' /proc/meminfo)"
  local swap_kb; swap_kb="$(awk '/SwapTotal/{print $2}' /proc/meminfo)"
  local need=0
  case "$CREATE_SWAP" in
    0) info "CREATE_SWAP=0，跳过"; return ;;
    1) need=1 ;;
    auto) if [ "$mem_kb" -lt 2000000 ] && [ "$swap_kb" -lt 102400 ]; then need=1; fi ;;
  esac
  if [ "$need" = 1 ] && [ ! -e /swapfile ]; then
    info "内存偏小，创建 2G swap（Next 构建 + sharp 较吃内存）"
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
    chmod 600 /swapfile; mkswap /swapfile >/dev/null; swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  else
    info "无需创建 swap（内存足够或已存在）"
  fi
}

# ── 1. 系统依赖 ──────────────────────────────────────────────────────────────
install_system_deps() {
  step "安装系统依赖（apt）"
  apt-get update -qq
  apt-get install -y -qq curl ca-certificates gnupg git build-essential \
    openssl rsync nginx postgresql postgresql-contrib >/dev/null
  info "基础包就绪（git / nginx / postgresql / build-essential 等）"

  local cur_major=0
  if command -v node >/dev/null; then cur_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"; fi
  if [ "$cur_major" -lt "$NODE_MAJOR" ]; then
    step "安装 Node ${NODE_MAJOR}.x（NodeSource）"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
    apt-get install -y -qq nodejs >/dev/null
  fi
  info "Node $(node -v)"

  # corepack 自带于 Node，启用后 pnpm 全局可用（项目 DEPLOY.md / vercel.json 约定 pnpm）
  corepack enable >/dev/null 2>&1 || npm i -g corepack >/dev/null 2>&1 || true
  corepack prepare pnpm@latest --activate >/dev/null 2>&1 || true
  command -v pnpm >/dev/null || die "pnpm 未就绪（corepack 启用失败）。"
  info "pnpm $(pnpm -v)"
}

# ── 2. Postgres：角色 + 库（幂等）────────────────────────────────────────────
ensure_postgres() {
  step "配置 PostgreSQL"
  systemctl enable --now postgresql >/dev/null 2>&1 || true

  # 复用既有 .env 里的密码（避免重跑时 DB 密码与连接串失配）；否则生成 hex 密码（URL/SQL/shell 全安全）
  if [ -z "$DB_PASS" ]; then
    local existing_uri; existing_uri="$(env_get DATABASE_URI)"
    if [ -n "$existing_uri" ]; then
      DB_PASS="$(printf '%s' "$existing_uri" | sed -n 's#.*://[^:]*:\([^@]*\)@.*#\1#p')"
    fi
    [ -n "$DB_PASS" ] || DB_PASS="$(openssl rand -hex 24)"
  fi

  local psql='sudo -u postgres psql -v ON_ERROR_STOP=1'
  if ! $psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    $psql -c "CREATE ROLE \"$DB_USER\" LOGIN PASSWORD '$DB_PASS';" >/dev/null
    info "创建角色 $DB_USER"
  fi
  $psql -c "ALTER ROLE \"$DB_USER\" PASSWORD '$DB_PASS';" >/dev/null
  if ! $psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
    info "创建数据库 $DB_NAME（owner=$DB_USER）"
  fi
  # PG15 起 public schema 默认不让非 owner 建表；把 public 归给应用角色，确保 payload migrate 能建表
  $psql -d "$DB_NAME" -c "ALTER SCHEMA public OWNER TO \"$DB_USER\";" >/dev/null 2>&1 || true
  $psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO \"$DB_USER\";" >/dev/null 2>&1 || true
  info "Postgres 就绪（本机 ${DB_HOST}:${DB_PORT} 密码认证）"
}

# ── 3. 运行用户 ──────────────────────────────────────────────────────────────
ensure_app_user() {
  step "创建运行用户 $APP_USER"
  if ! id "$APP_USER" >/dev/null 2>&1; then
    useradd --system --create-home --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
    info "已建系统用户 $APP_USER（home=$APP_DIR）"
  else
    info "用户 $APP_USER 已存在"
  fi
  mkdir -p "$APP_DIR"
}

# ── 4. 取代码 ────────────────────────────────────────────────────────────────
sync_code() {
  step "准备代码到 $APP_DIR"
  # 探测脚本所在仓库（你在服务器上的 checkout），优先本地拷贝，免去私有仓库鉴权
  local script_path src_repo=""
  script_path="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || true)"
  if [ -n "$script_path" ] && [ -f "$script_path" ]; then
    src_repo="$(git -C "$(dirname "$script_path")" rev-parse --show-toplevel 2>/dev/null || true)"
    [ -n "$src_repo" ] && git config --global --add safe.directory "$src_repo" 2>/dev/null || true
  fi

  if [ -f "$APP_DIR/package.json" ]; then
    info "$APP_DIR 已有项目 → 就地部署"
    if [ "$GIT_PULL" = "1" ] && [ -d "$APP_DIR/.git" ]; then
      git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
      git -C "$APP_DIR" pull --ff-only || warn "git pull 失败，沿用现有代码"
    fi
  elif [ -n "$src_repo" ] && [ "$src_repo" != "$APP_DIR" ]; then
    info "从本地 checkout 克隆：$src_repo"
    if [ -n "$(git -C "$src_repo" status --porcelain 2>/dev/null)" ]; then
      warn "源仓库有未提交改动，仅部署已提交内容（HEAD）"
    fi
    rm -rf "$APP_DIR"; git clone -q "$src_repo" "$APP_DIR"
    git -C "$APP_DIR" remote set-url origin "$REPO_URL" 2>/dev/null || true
  else
    info "克隆远程仓库：$REPO_URL"
    rm -rf "$APP_DIR"; git clone -q "$REPO_URL" "$APP_DIR" || \
      die "克隆失败。私有仓库请先手动把代码放到 $APP_DIR 再重跑，或设 REPO_URL。"
  fi
  [ -n "$GIT_REF" ] && git -C "$APP_DIR" checkout -q "$GIT_REF" 2>/dev/null || true

  mkdir -p "$APP_DIR/media"          # 本地磁盘媒体目录（无 S3 时上传落这里，对应 .gitignore 的 /media）
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
  git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
  info "代码就绪"
}

# ── 5. 生成 .env（保留已有 PAYLOAD_SECRET）──────────────────────────────────
generate_env() {
  step "生成 .env"
  local secret; secret="$(env_get PAYLOAD_SECRET)"
  if [ -z "$secret" ] || [ "$secret" = "replace-with-a-long-random-string" ]; then
    secret="$(openssl rand -base64 32)"
    info "生成新的 PAYLOAD_SECRET（请勿轮换，换了所有后台会话失效）"
  else
    info "保留已有 PAYLOAD_SECRET"
  fi

  local db_uri="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  # 写裸 KEY=value（无引号）：systemd EnvironmentFile 与 Next dotenv 都能正确解析；
  # 密码为 hex、secret 为 base64，均无空格/shell 特殊字符，安全。
  umask 077
  cat > "$ENV_FILE" <<EOF
# 本文件由 scripts/deploy-debian12.sh 生成。含密钥，权限 600，勿提交。
# ── 数据库（本机 Postgres，单连接串；build:deploy 的 DATABASE_URI_DIRECT 未设则回退到它）──
DATABASE_URI=${db_uri}
# ── Payload ──（一次性生成，永不轮换）
PAYLOAD_SECRET=${secret}
# ── 站点地址 ──（留空＝媒体走同源相对路径 /api/media/file/*，next/image 无需白名单、最稳）
# 若改成正式域名，需把该域名加进 next.config.ts 的 images.remotePatterns，否则图裂。
NEXT_PUBLIC_SERVER_URL=${SERVER_URL}
EOF
  chown "$APP_USER:$APP_USER" "$ENV_FILE"; chmod 600 "$ENV_FILE"
  info "写入 $ENV_FILE"
}

# ── 6. 安装依赖 + 构建（以运行用户身份；先迁移建表再 next build）───────────────
build_app() {
  step "安装依赖并构建（首次较慢）"
  # runuser 以 $APP_USER 跑、加载其登录环境（PATH 含 node/pnpm）；source .env 让 migrate/build 拿到变量。
  # build:deploy = payload migrate && next build —— 顺序关键：/c/[slug]、/p/[id] 构建期会查库。
  local seed_cmd=""
  if [ "$RUN_SEED" = "1" ]; then seed_cmd="&& echo '↻ 跑 seed 示例数据' && pnpm seed"; fi
  runuser -u "$APP_USER" -- bash -lc "
    set -euo pipefail
    cd '$APP_DIR'
    set -a; . ./.env; set +a
    if ! pnpm install --frozen-lockfile; then
      echo '⚠ frozen-lockfile 失败，回退普通 install'; pnpm install
    fi
    pnpm run build:deploy
    $seed_cmd
  " || die "构建失败（看上面的报错）。常见原因：内存不足（设 CREATE_SWAP=1 重跑）、数据库连不上。"
  info "构建完成（已应用迁移 + next build）"
}

# ── 7. systemd 服务 ─────────────────────────────────────────────────────────
setup_systemd() {
  step "配置 systemd 服务：$APP_NAME"
  # ExecStart 直接用 /usr/bin/node 调 next 的 bin（稳定，不依赖运行时 PATH 里的 pnpm）。
  # 绑 127.0.0.1：只让 Nginx 反代访问。ReadWritePaths=$APP_DIR：ISR 要写 .next/cache、上传要写 media。
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=${APP_NAME} (Next.js + Payload)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node ${APP_DIR}/node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${APP_PORT}
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=${APP_DIR}

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable "$APP_NAME" >/dev/null 2>&1 || true
  systemctl restart "$APP_NAME"
  sleep 2
  systemctl is-active --quiet "$APP_NAME" \
    && info "服务已启动（systemctl status $APP_NAME 查看）" \
    || { warn "服务未能启动，最近日志："; journalctl -u "$APP_NAME" -n 30 --no-pager || true; die "启动失败。"; }
}

# ── 8. Nginx 反代（+ 可选 certbot）──────────────────────────────────────────
setup_nginx() {
  step "配置 Nginx 反向代理"
  local server_name="${DOMAIN:-_}"
  # client_max_body_size 关键：无 S3 时后台上传经 Node，Nginx 默认 1M 会拦大图。
  cat > "$NGINX_SITE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${server_name};

    client_max_body_size ${NGINX_MAX_BODY};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}
EOF
  ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/${APP_NAME}"
  rm -f /etc/nginx/sites-enabled/default   # 移除默认站，避免 server_name _ 冲突
  nginx -t >/dev/null 2>&1 || die "nginx 配置测试失败（nginx -t 看详情）。"
  systemctl reload nginx
  info "Nginx 已反代 80 → 127.0.0.1:${APP_PORT}"

  if [ "$ENABLE_TLS" = "1" ]; then
    step "申请 HTTPS 证书（certbot）"
    apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
    if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect; then
      info "已为 $DOMAIN 签发证书并开启 80→443 跳转（自动续期由 certbot.timer 接管）"
    else
      warn "certbot 失败（域名是否已解析到本机？80 端口是否可达？）。HTTP 仍可用，可稍后重试。"
    fi
  fi
}

# ── 主流程 ───────────────────────────────────────────────────────────────────
echo -e "${c_blue}=== ${APP_NAME} · Debian 12 一键部署 ===${c_off}"
maybe_swap
install_system_deps
ensure_postgres
ensure_app_user
sync_code
generate_env
build_app
setup_systemd
setup_nginx

# ── 结语 ─────────────────────────────────────────────────────────────────────
ip_addr="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ "$ENABLE_TLS" = "1" ]; then access_url="https://${DOMAIN}"
elif [ -n "$DOMAIN" ];        then access_url="http://${DOMAIN}"
else                               access_url="http://${ip_addr:-<服务器IP>}"
fi
cat <<EOF

$(echo -e "${c_green}🎉 部署完成${c_off}")
  访问站点：   ${access_url}
  后台地址：   ${access_url}/admin   ← 首次访问，第一个注册的账号自动成为超级管理员
  应用目录：   ${APP_DIR}
  环境变量：   ${APP_DIR}/.env        （含密钥，权限 600）
  数据库：     ${DB_NAME} @ ${DB_HOST}:${DB_PORT}（用户 ${DB_USER}）

  常用命令：
    查看日志    journalctl -u ${APP_NAME} -f
    重启        systemctl restart ${APP_NAME}
    状态        systemctl status ${APP_NAME}
    更新代码后重新部署   GIT_PULL=1 bash ${APP_DIR}/scripts/deploy-debian12.sh

  备份要点：定期备份 Postgres（pg_dump ${DB_NAME}）与媒体目录 ${APP_DIR}/media。
EOF
