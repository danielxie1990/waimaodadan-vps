#!/bin/bash
# ─── Deploy Script for VPS ─────────────────────
# For non-Docker deployments (advanced users).
# Most users should use Docker: docker compose up -d
#
# Usage: ssh root@yourserver 'bash -s' < deploy.sh
#
# Prerequisites (one-time):
#   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
#   apt install -y nodejs git caddy
#   npm install -g pm2
#   git clone <repo-url> /var/www/yoursite
#   cd /var/www/yoursite && ./deploy.sh

set -e

APP_DIR="/var/www/yoursite"
cd "$APP_DIR"

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Installing dependencies ==="
npm install --production

echo "=== Generating Prisma client ==="
npx prisma generate

echo "=== Applying database migrations ==="
npx prisma migrate deploy

echo "=== Seeding demo data (if empty) ==="
npx tsx prisma/seed.ts

echo "=== Building ==="
npm run build

echo "=== Restarting app ==="
pm2 restart yoursite || pm2 start npm --name yoursite -- start

echo "=== Saving PM2 config ==="
pm2 save

echo "✅ Deploy complete"
echo "   Open your browser and follow the setup wizard."
