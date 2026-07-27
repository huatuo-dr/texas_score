# 德州记分

手机竖屏优先的德州扑克本地记分工具。数据仅保存在浏览器 `localStorage`，无后端、无账号。

## 技术栈

- Vite + React + TypeScript
- 本地持久化：`localStorage`（键名 `texas_score_v1`）
- 分享图：`html-to-image`
- 部署：服务器构建 `dist` + 系统 Nginx（无 Docker / 无 GitHub Actions）

## 本地开发

```bash
npm install
npm run dev
```

## 测试 / 构建

```bash
npm test
npm run build      # 产出 dist/
```

## 腾讯云服务器部署

完整说明见 **`docs/01-腾讯云部署方案.html`（v1.3）**。

### 首次（一次性）

1. 服务器安装 Node 20+、Git、rsync（可选）
2. 克隆仓库，例如 `/opt/texas_score`
3. 创建站点目录并授权：
   ```bash
   sudo mkdir -p /var/www/texas-score
   sudo chown -R "$USER:$USER" /var/www/texas-score
   ```
4. 配置 Nginx（参考仓库内示例）：
   ```bash
   sudo cp deploy/nginx-texas-score.conf.example /etc/nginx/conf.d/texas-score.conf
   # 编辑 server_name / listen 后：
   sudo nginx -t && sudo systemctl reload nginx
   ```
5. 执行部署：
   ```bash
   cd /opt/texas_score
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   # 或：npm run deploy
   ```

### 日常发版

```bash
cd /opt/texas_score
git pull
./scripts/deploy.sh
```

脚本会：`npm ci` → `npm run build` → 同步到 `/var/www/texas-score` → 尝试 `nginx -t && reload`。

| 环境变量 | 默认 | 说明 |
|----------|------|------|
| `DEPLOY_DIR` | `/var/www/texas-score` | Nginx 站点根目录 |
| `RELOAD_NGINX` | `1` | 设为 `0` 则只同步不 reload |

HTTPS：见部署文档 §8；正式分享建议域名 + certbot。

## 仓库结构（部署相关）

```text
scripts/deploy.sh                      # 一键部署
deploy/nginx-texas-score.conf.example  # Nginx 配置示例（含 index.html no-cache）
docs/00-初版方案.html                  # 产品方案
docs/01-腾讯云部署方案.html            # 部署方案 v1.3
```

## 方案文档

- 产品方案：`docs/00-初版方案.html`（V1.2）
- 腾讯云部署：`docs/01-腾讯云部署方案.html`（v1.3）
