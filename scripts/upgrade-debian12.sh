#!/usr/bin/env bash
#
# Debian 12 自托管「增量升级」脚本 —— scripts/deploy-debian12.sh 的搭档
# ──────────────────────────────────────────────────────────────────────────
# 用于：已用 deploy-debian12.sh 部署过的实例，把代码升级到最新（或指定 ref）。
#
# 只做这几件事（全部幂等、可重复）：
#   1) （可选）升级前用 pg_dump 备份数据库到 $APP_DIR/backups/
#   2) git pull（或 checkout 到 $GIT_REF），记录 旧→新 提交
#   3) pnpm install --frozen-lockfile
#   4) pnpm run build:deploy（先 payload migrate 应用迁移，再 next build）
#   5) 重启 systemd 服务并做 HTTP 健康检查
#
# 不碰：apt 依赖 / PostgreSQL 角色库 / .env / systemd 单元 / Nginx —— 这些初次部署
# 已就绪。要改基建（域名、TLS、端口、换库）仍回去跑 deploy-debian12.sh。
#
# 零宕机要点：构建在重启之前完成。构建失败 → 旧服务继续在线，DB 已备份，按结语回滚。
#
# 用法（在服务器上，以能 sudo 的普通用户执行；脚本会自动 sudo 提权）：
#   bash scripts/upgrade-debian12.sh
#   GIT_REF=v1.2.0 bash scripts/upgrade-debian12.sh     # 升到指定 tag / 分支
#   BACKUP=0       bash scripts/upgrade-debian12.sh      # 跳过升级前 DB 备份
#   FORCE=1        bash scripts/upgrade-debian12.sh      # 无新提交也强制重建
#
# 常用可覆盖变量（均有默认值，须与当初 deploy 时一致）：
#   APP_NAME     应用名（服务名/库名/目录名）   默认 sexgirl-web
#   APP_DIR      部署目录                       默认 /opt/$APP_NAME
#   APP_USER     运行用户                       默认 $APP_NAME
#   GIT_REMOTE   拉取远程名                     默认 origin
#   GIT_REF      升级到的分支/标签              默认 当前所在分支的远程跟踪
#   BACKUP       =1 升级前 pg_dump 备份         默认 1
#   HEALTHCHECK  =1 重启后 curl 健康检查        默认 1
#   APP_PORT     健康检查端口                   默认 从 systemd 单元读取，回退 3000
#   KEEP_BACKUPS 备份保留个数（清理更早的）     默认 7
#
set -euo pipefail

# ── 自动提权：非 root 时用 sudo 重跑自身（-E 保留环境变量覆盖）──────────────────
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    exec sudo -E bash "$0" "$@"
  else
    echo "本机没有 sudo：请先切到 root（su -）再运行本脚本。" >&2
    exit 1
  fi
fi

# ── 可配置项（与 deploy-debian12.sh 同默认）─────────────────────────────────────
APP_NAME="${APP_NAME:-sexgirl-web}"
APP_USER="${APP_USER:-$APP_NAME}"
APP_DIR="${APP_DIR:-/opt/$APP_NAME}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_REF="${GIT_REF:-}"
BACKUP="${BACKUP:-1}"
HEALTHCHECK="${HEALTHCHECK:-1}"
KEEP_BACKUPS="${KEEP_BACKUPS:-7}"
FORCE="${FORCE:-0}"

ENV_FILE="$APP_DIR/.env"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
BACKUP_DIR="$APP_DIR/backups"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# ── 日志小工具（同 deploy 脚本）────────────────────────────────────────────────
c_blue='\033[1;34m'; c_green='\033[1;32m'; c_yellow='\033[1;33m'; c_red='\033[1;31m'; c_off='\033[0m'
step() { echo -e "\n${c_blue}▸ $*${c_off}"; }
info() { echo -e "  ${c_green}✓${c_off} $*"; }
warn() { echo -e "  ${c_yellow}!${c_off} $*"; }
die()  { echo -e "${c_red}✗ $*${c_off}" >&2; exit 1; }

env_get() { [ -f "$ENV_FILE" ] && sed -n "s/^$1=//p" "$ENV_FILE" | head -n1 || true; }

# ── 0. 前置校验：必须是已部署过的实例 ───────────────────────────────────────────
step "校验部署环境"
[ -d "$APP_DIR/.git" ] || die "$APP_DIR 不是 git 仓库 —— 这台机器还没用 deploy-debian12.sh 部署过。请先跑初次部署。"
[ -f "$ENV_FILE" ]     || die "缺少 $ENV_FILE —— 请先用 deploy-debian12.sh 完成初次部署。"
[ -f "$SERVICE_FILE" ] || die "缺少 systemd 单元 $SERVICE_FILE —— 请先用 deploy-debian12.sh 完成初次部署。"
id "$APP_USER" >/dev/null 2>&1 || die "运行用户 $APP_USER 不存在 —— 请先用 deploy-debian12.sh 部署。"
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
info "实例就绪：$APP_DIR（用户 $APP_USER，服务 $APP_NAME）"

# 端口：优先从 systemd 单元的 Environment=PORT= 读，回退 3000
APP_PORT="${APP_PORT:-$(sed -n 's/^Environment=PORT=//p' "$SERVICE_FILE" | head -n1)}"
APP_PORT="${APP_PORT:-3000}"

# ── 1. 升级前备份数据库（best-effort）──────────────────────────────────────────
backup_db() {
  [ "$BACKUP" = "1" ] || { info "BACKUP=0，跳过数据库备份"; return; }
  step "备份数据库（pg_dump）"
  local uri db ts out
  uri="$(env_get DATABASE_URI)"
  [ -n "$uri" ] || { warn "读不到 DATABASE_URI，跳过备份"; return; }
  db="${uri##*/}"; db="${db%%\?*}"        # 取连接串最后一段为库名，去掉可能的 ?query
  [ -n "$db" ] || { warn "解析不出库名，跳过备份"; return; }
  mkdir -p "$BACKUP_DIR"
  ts="$(date +%Y%m%d-%H%M%S)"
  out="$BACKUP_DIR/db-${db}-${ts}.sql.gz"
  # 用 postgres 超级用户做 peer 认证的逻辑备份（无需密码）；失败只告警不中断升级
  if runuser -u postgres -- pg_dump "$db" 2>/dev/null | gzip > "$out"; then
    chown "$APP_USER:$APP_USER" "$out" 2>/dev/null || true
    info "已备份 → $out （$(du -h "$out" | cut -f1)）"
    # 清理超过 KEEP_BACKUPS 个的旧备份
    ls -1t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | tail -n +"$((KEEP_BACKUPS + 1))" | xargs -r rm -f
  else
    rm -f "$out"
    warn "pg_dump 失败（库名 $db 是否正确？postgres 用户可访问？）—— 跳过备份，继续升级"
  fi
}

# ── 2. 拉取最新代码 ─────────────────────────────────────────────────────────────
OLD_REF=""; NEW_REF=""
pull_code() {
  step "拉取代码（$GIT_REMOTE）"
  OLD_REF="$(git -C "$APP_DIR" rev-parse HEAD)"
  git -C "$APP_DIR" fetch --prune "$GIT_REMOTE" 2>&1 | sed 's/^/    /' || die "git fetch 失败（网络 / 远程可达？）"
  if [ -n "$GIT_REF" ]; then
    git -C "$APP_DIR" checkout -q "$GIT_REF" || die "checkout $GIT_REF 失败"
    git -C "$APP_DIR" merge --ff-only "$GIT_REMOTE/$GIT_REF" 2>/dev/null || true   # ref 为分支时跟进远程
  else
    git -C "$APP_DIR" merge --ff-only "@{u}" 2>/dev/null \
      || die "无法快进合并到上游（本地有提交/冲突？）。先在服务器 git status 排查，或设 GIT_REF=指定。"
  fi
  NEW_REF="$(git -C "$APP_DIR" rev-parse HEAD)"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR/.git" "$APP_DIR" 2>/dev/null || true

  if [ "$OLD_REF" = "$NEW_REF" ] && [ "$FORCE" != "1" ]; then
    info "无新提交，已是最新（$(git -C "$APP_DIR" rev-parse --short HEAD)）。FORCE=1 可强制重建。"
    echo -e "\n${c_green}✓ 无需升级${c_off}"
    exit 0
  fi
  info "代码 $(git -C "$APP_DIR" rev-parse --short "$OLD_REF") → $(git -C "$APP_DIR" rev-parse --short "$NEW_REF")"
  echo "    变更："; git -C "$APP_DIR" log --oneline "${OLD_REF}..${NEW_REF}" 2>/dev/null | sed 's/^/      /' | head -20 || true
}

# ── 3. 安装依赖 + 构建（迁移在前，构建在后；以运行用户身份）─────────────────────
build_app() {
  step "安装依赖并构建（迁移 + next build）"
  # build:deploy = payload migrate && next build。构建期 /c/[slug]、/p/[id] 会查库，故须先迁移。
  # 构建成功才会进入下一步重启 —— 失败时旧服务仍在线。
  runuser -u "$APP_USER" -- bash -lc "
    set -euo pipefail
    export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
    cd '$APP_DIR'
    set -a; . ./.env; set +a
    if ! pnpm install --frozen-lockfile; then
      echo '⚠ frozen-lockfile 失败，回退普通 install'; pnpm install
    fi
    pnpm run build:deploy
  " || die "构建/迁移失败 —— 旧服务仍在运行（未重启）。
  回滚代码：sudo -u $APP_USER git -C $APP_DIR reset --hard $OLD_REF
  如迁移已部分应用且需还原，用最近备份：$BACKUP_DIR/（gunzip 后 psql 导入）。"
  info "构建完成（迁移已应用 + next build）"
}

# ── 4. 重启服务 + 健康检查 ──────────────────────────────────────────────────────
restart_and_check() {
  step "重启服务：$APP_NAME"
  systemctl restart "$APP_NAME"
  sleep 2
  systemctl is-active --quiet "$APP_NAME" \
    || { warn "服务未启动，最近日志："; journalctl -u "$APP_NAME" -n 30 --no-pager || true; die "重启失败。"; }
  info "服务已重启"

  [ "$HEALTHCHECK" = "1" ] || return 0
  command -v curl >/dev/null 2>&1 || { warn "无 curl，跳过健康检查"; return 0; }
  step "健康检查 http://127.0.0.1:${APP_PORT}/"
  local code="" i
  for i in 1 2 3 4 5 6; do
    code="$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/" 2>/dev/null || true)"
    case "$code" in 2??|3??) info "健康检查通过（HTTP $code）"; return 0 ;; esac
    sleep 2
  done
  warn "健康检查未通过（最后 HTTP「${code:-无响应}」）。查日志：journalctl -u $APP_NAME -n 50 --no-pager"
  warn "服务进程在跑但首页未正常响应；如需回滚见结语。"
}

# ── 主流程 ───────────────────────────────────────────────────────────────────
echo -e "${c_blue}=== ${APP_NAME} · Debian 12 增量升级 ===${c_off}"
backup_db
pull_code
build_app
restart_and_check

# ── 结语 ─────────────────────────────────────────────────────────────────────
cat <<EOF

$(echo -e "${c_green}🎉 升级完成${c_off}")
  版本：     $(git -C "$APP_DIR" rev-parse --short "$OLD_REF") → $(git -C "$APP_DIR" rev-parse --short "$NEW_REF")
  应用目录： ${APP_DIR}
  端口：     127.0.0.1:${APP_PORT}（经 Nginx 反代）

  常用命令：
    查看日志   journalctl -u ${APP_NAME} -f
    服务状态   systemctl status ${APP_NAME}
    回滚代码   sudo -u ${APP_USER} git -C ${APP_DIR} reset --hard ${OLD_REF} && \\
               BACKUP=0 bash ${APP_DIR}/scripts/upgrade-debian12.sh   # 用旧代码重建并重启

  备份目录： ${BACKUP_DIR}/（保留最近 ${KEEP_BACKUPS} 份；BACKUP=0 可跳过备份）
EOF
