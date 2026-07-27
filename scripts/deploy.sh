#!/usr/bin/env bash
# 德州记分 · 服务器一键部署
# 用法（在项目根目录或任意位置）：
#   ./scripts/deploy.sh
#   DEPLOY_DIR=/var/www/texas-score ./scripts/deploy.sh
#
# 典型发版流程：
#   git pull
#   ./scripts/deploy.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $*"; }
ok() { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# 项目根目录（scripts/ 的上一级）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

# Nginx 站点目录（可通过环境变量覆盖）
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/texas-score}"

# 是否在同步后执行 nginx -t && reload（默认是；设为 0 可跳过）
RELOAD_NGINX="${RELOAD_NGINX:-1}"

info "项目目录: ${ROOT_DIR}"
info "发布目录: ${DEPLOY_DIR}"

# ---- 检查依赖 ----
if ! command -v node >/dev/null 2>&1; then
  err "未找到 node，请先在服务器安装 Node.js 20+"
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  err "未找到 npm"
  exit 1
fi

NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
if [[ "${NODE_MAJOR}" -lt 18 ]]; then
  warn "当前 Node 版本为 $(node -v)，建议使用 20+"
fi

# ---- 安装依赖并构建 ----
info "安装依赖 (npm ci)..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  warn "未找到 package-lock.json，改用 npm install"
  npm install
fi

info "构建生产产物 (npm run build)..."
npm run build

if [[ ! -d "${ROOT_DIR}/dist" ]] || [[ ! -f "${ROOT_DIR}/dist/index.html" ]]; then
  err "构建失败：未找到 dist/index.html"
  exit 1
fi

DIST_SIZE="$(du -sh "${ROOT_DIR}/dist" | awk '{print $1}')"
ok "构建完成，dist 大小约 ${DIST_SIZE}"

# ---- 同步到 Nginx 目录 ----
info "同步 dist/ → ${DEPLOY_DIR}"

if [[ ! -d "${DEPLOY_DIR}" ]]; then
  info "发布目录不存在，尝试创建..."
  if mkdir -p "${DEPLOY_DIR}" 2>/dev/null; then
    ok "已创建 ${DEPLOY_DIR}"
  else
    info "无权限直接创建，尝试 sudo..."
    sudo mkdir -p "${DEPLOY_DIR}"
    # 尽量让当前用户可写，便于下次 rsync 不 sudo
    if sudo chown -R "$(id -u):$(id -g)" "${DEPLOY_DIR}" 2>/dev/null; then
      ok "已创建并由当前用户接管 ${DEPLOY_DIR}"
    else
      warn "无法 chown，后续同步可能需要 sudo"
    fi
  fi
fi

sync_dist() {
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "${ROOT_DIR}/dist/" "${DEPLOY_DIR}/"
  else
    warn "未安装 rsync，使用 rm + cp 代替"
    # 清空目标后拷贝（保留目录本身）
    find "${DEPLOY_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -a "${ROOT_DIR}/dist/." "${DEPLOY_DIR}/"
  fi
}

if [[ -w "${DEPLOY_DIR}" ]]; then
  sync_dist
else
  info "对 ${DEPLOY_DIR} 无写权限，使用 sudo 同步..."
  if command -v rsync >/dev/null 2>&1; then
    sudo rsync -a --delete "${ROOT_DIR}/dist/" "${DEPLOY_DIR}/"
  else
    sudo bash -c "find '${DEPLOY_DIR}' -mindepth 1 -maxdepth 1 -exec rm -rf {} + && cp -a '${ROOT_DIR}/dist/.' '${DEPLOY_DIR}/'"
  fi
fi

ok "静态文件已更新"

# ---- 发布结果自检 ----
if [[ ! -f "${DEPLOY_DIR}/index.html" ]]; then
  err "同步后未找到 ${DEPLOY_DIR}/index.html，请检查权限与路径"
  exit 1
fi
if [[ ! -d "${DEPLOY_DIR}/assets" ]]; then
  warn "未找到 ${DEPLOY_DIR}/assets，页面可能异常"
fi
info "发布目录内容："
ls -la "${DEPLOY_DIR}" | head -20 || true

# ---- 可选：重载 Nginx ----
if [[ "${RELOAD_NGINX}" == "1" ]]; then
  if command -v nginx >/dev/null 2>&1; then
    info "检查并重载 Nginx..."
    if sudo nginx -t; then
      # reload 优先；部分环境用 systemctl
      if sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null; then
        ok "Nginx 已 reload"
      else
        warn "nginx -t 通过，但 reload 失败，请手动检查"
      fi
    else
      err "nginx -t 失败，文件已同步但未 reload，请修复配置后手动 reload"
      exit 1
    fi
  else
    warn "未检测到 nginx 命令，跳过 reload"
    warn "请确认 Nginx 已配置 root ${DEPLOY_DIR}（可参考 deploy/nginx-texas-score.conf.example）"
  fi
else
  info "已跳过 Nginx reload（RELOAD_NGINX=${RELOAD_NGINX}）"
fi

echo
ok "部署完成"
info "站点目录: ${DEPLOY_DIR}"
info "Nginx 示例: ${ROOT_DIR}/deploy/nginx-texas-score.conf.example"
info "文档: ${ROOT_DIR}/docs/01-腾讯云部署方案.html"
info "下次发版: git pull && ./scripts/deploy.sh"
