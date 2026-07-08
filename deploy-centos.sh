#!/bin/bash
# ─── CentOS 8 Deployment Script for waimaodadan-vps ─────────────────
# Run this on your CentOS 8 VPS as root or with sudo.
#
# Usage:
#   ssh root@YOUR_SERVER_IP
#   # Paste the lines below or upload this script, then:
#   bash deploy-centos.sh
#
# What this does:
#   1. Installs Docker + Docker Compose (CentOS 8 compatible)
#   2. Clones the repo from GitHub
#   3. Prompts for your domain and JWT secret
#   4. Configures Caddy + environment
#   5. Starts the application
#   6. Sets up firewall + auto-start
#
# ────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║  Product Website CMS — CentOS 8 Deploy  ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ─── Check root ──
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo).${NC}"
   exit 1
fi

# ─── Config prompts ──
echo ""
echo -e "${YELLOW}Step 1: Configure your domain${NC}"
echo -e "  If you have a domain (e.g., waimaodadan.com), enter it."
echo -e "  If you don't have one yet, just press Enter to use HTTP on port 3000."
read -rp "  Domain name (press Enter to skip): " DOMAIN

echo ""
echo -e "${YELLOW}Step 2: JWT Secret (for admin login security)${NC}"
echo -e "  Leave blank to auto-generate a secure random key."
read -rp "  JWT Secret (press Enter to generate): " JWT_SECRET_INPUT
JWT_SECRET="${JWT_SECRET_INPUT:-$(openssl rand -hex 32 2>/dev/null || date +%s | sha256sum | head -c 64)}"

echo ""
echo -e "${YELLOW}Step 3: GitHub repo URL${NC}"
echo -e "  Press Enter to use the default, or paste your own."
read -rp "  Repo URL [https://github.com/danielxie1990/waimaodadan-vps.git]: " REPO_URL
REPO_URL="${REPO_URL:-https://github.com/danielxie1990/waimaodadan-vps.git}"

echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "  Domain:      ${GREEN}${DOMAIN:-<none (HTTP only)>}${NC}"
echo -e "  JWT Secret:  ${GREEN}${JWT_SECRET:0:16}...${NC}"
echo -e "  Repository:  ${GREEN}${REPO_URL}${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""
read -rp "Proceed with deployment? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo -e "${RED}Aborted.${NC}"
  exit 1
fi

# ─── 1. Install Docker (CentOS 8) ──
echo ""
echo -e "${GREEN}[1/7] Installing Docker...${NC}"

# Remove old Docker packages if any
yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true

# Install yum-utils and add Docker repo
yum install -y yum-utils
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# CentOS 8 is EOL; Docker repo may fail. Fallback to docker.io if needed.
yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin 2>/dev/null || {
  echo -e "${YELLOW}Docker CE repo unavailable (CentOS 8 EOL). Trying docker.io...${NC}"
  yum install -y docker.io docker-compose-plugin 2>/dev/null || {
    echo -e "${YELLOW}Fallback: using get.docker.com script...${NC}"
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
  }
}

systemctl enable docker --now
echo -e "${GREEN}  ✓ Docker installed${NC}"

# ─── 2. Clone repo ──
echo ""
echo -e "${GREEN}[2/7] Cloning repository...${NC}"

APP_DIR="/opt/waimaodadan"
if [ -d "$APP_DIR" ]; then
  echo -e "  Directory ${APP_DIR} already exists. Updating..."
  cd "$APP_DIR"
  git pull
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo -e "${GREEN}  ✓ Repository cloned to ${APP_DIR}${NC}"

# ─── 3. Configure Caddyfile ──
echo ""
echo -e "${GREEN}[3/7] Configuring Caddyfile...${NC}"

if [ -n "$DOMAIN" ]; then
  # Replace example.com placeholder with actual domain
  sed -i "s/example.com/$DOMAIN/g" "$APP_DIR/Caddyfile"
  # Update static file paths
  sed -i "s|/var/www/your-site|$APP_DIR|g" "$APP_DIR/Caddyfile"
  sed -i "s|/var/log/caddy/your-site.log|/var/log/caddy/${DOMAIN}.log|g" "$APP_DIR/Caddyfile"

  # Create Caddy log directory
  mkdir -p /var/log/caddy

  echo -e "${GREEN}  ✓ Caddy configured for ${DOMAIN}${NC}"
else
  echo -e "${YELLOW}  No domain set — Caddy will not be used.${NC}"
  echo -e "${YELLOW}  Access the site via http://SERVER_IP:3000${NC}"
fi

# ─── 4. Create docker-compose override with JWT secret ──
echo ""
echo -e "${GREEN}[4/7] Setting environment secrets...${NC}"

# Create a docker-compose.override.yml with secrets (not in git)
cat > "$APP_DIR/docker-compose.override.yml" << OVERRIDEEOF
version: "3.8"

services:
  app:
    environment:
      - JWT_SECRET=${JWT_SECRET}
OVERRIDEEOF

chmod 600 "$APP_DIR/docker-compose.override.yml"

if [ -n "$DOMAIN" ]; then
  # Add Caddy service to docker-compose
  cat > "$APP_DIR/docker-compose.caddy.yml" << CADDYEOF
version: "3.8"

services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - \$PWD/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
      - \$PWD:/app
    depends_on:
      - app

volumes:
  caddy_data:
  caddy_config:
CADDYEOF

  echo -e "${GREEN}  ✓ Caddy Docker service configured${NC}"
fi

echo -e "${GREEN}  ✓ Secrets configured${NC}"

# ─── 5. Build and start ──
echo ""
echo -e "${GREEN}[5/7] Building and starting the application...${NC}"

cd "$APP_DIR"

# Build the Docker image
docker compose build 2>&1 | tail -5

echo -e "${GREEN}  ✓ Build complete${NC}"

# Start the stack
if [ -n "$DOMAIN" ]; then
  docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.caddy.yml up -d
else
  docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
fi

echo -e "${GREEN}  ✓ Application started${NC}"

# ─── 6. Firewall ──
echo ""
echo -e "${GREEN}[6/7] Configuring firewall...${NC}"

if command -v firewall-cmd &> /dev/null; then
  if [ -n "$DOMAIN" ]; then
    firewall-cmd --permanent --add-service=http --add-service=https 2>/dev/null || true
  else
    firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
  fi
  firewall-cmd --reload 2>/dev/null || true
  echo -e "${GREEN}  ✓ Firewall configured${NC}"
else
  echo -e "${YELLOW}  firewall-cmd not available. Configure firewall manually:${NC}"
  if [ -n "$DOMAIN" ]; then
    echo -e "    Open ports 80 (HTTP) and 443 (HTTPS)"
  else
    echo -e "    Open port 3000"
  fi
fi

# ─── 7. Status check ──
echo ""
echo -e "${GREEN}[7/7] Checking deployment status...${NC}"
sleep 5

if docker ps | grep -q "waimaodadan"; then
  echo -e "${GREEN}  ✓ Application is running!${NC}"
else
  echo -e "${YELLOW}  ⚠ Container status:${NC}"
  docker compose ps
  echo ""
  echo -e "${YELLOW}  Checking logs...${NC}"
  docker compose logs --tail=20
fi

# ─── Summary ──
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           ✅ Deployment Complete          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
if [ -n "$DOMAIN" ]; then
  echo -e "  Your site:  ${GREEN}https://${DOMAIN}${NC}"
else
  echo -e "  Your site:  ${GREEN}http://YOUR_SERVER_IP:3000${NC}"
fi
echo ""
echo -e "  Admin panel:  ${GREEN}/admin/login/${NC}"
echo "  (First visit runs the setup wizard)"
echo ""
echo -e "  Useful commands:"
echo -e "    docker compose logs -f       # View logs"
echo -e "    docker compose restart       # Restart app"
echo -e "    docker compose pull          # Update image"
echo ""
echo -e "  ${YELLOW}Next step:${NC}"
echo -e "  1. Point your domain's DNS A record to this server's IP"
echo -e "  2. Open the site in a browser and follow the setup wizard"
echo -e "  3. Log in at /admin/login/ and start building your site"
echo ""
