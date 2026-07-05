#!/bin/bash
# ─── Deploy Script for VPS ─────────────────────
# Usage: ssh root@yourserver 'bash -s' < deploy.sh
#
# Prerequisites (one-time):
#   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
#   apt install -y nodejs git caddy
#   npm install -g pm2
#   git clone https://github.com/danielxie1990/waimaodadan-vps.git /var/www/waimaodadan
#   cd /var/www/waimaodadan && ./deploy.sh

set -e

APP_DIR="/var/www/waimaodadan"
cd "$APP_DIR"

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Installing dependencies ==="
npm install --production

echo "=== Generating Prisma client ==="
npx prisma generate

echo "=== Pushing schema (safe: won't drop data) ==="
npx prisma db push --skip-generate

echo "=== Building ==="
npm run build

echo "=== Restarting app ==="
pm2 restart waimaodadan || pm2 start npm --name waimaodadan -- start

echo "=== Saving PM2 config ==="
pm2 save

echo "✅ Deploy complete"
echo "   Site: https://waimaodadan.com"
echo "   Logs: pm2 logs waimaodadan"
