# Product Website CMS

A ready-to-use website CMS for product-based businesses.
No coding required. Built with Next.js + SQLite.

---

## 🚀 Quick Start (Docker — Recommended)

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) installed on your server or VPS.

```bash
# 1. Download or clone this project
git clone <your-repo-url> project
cd project

# 2. Start everything with one command
docker compose up -d

# 3. Open your browser
#    → http://localhost:3000
#    → Follow the on-screen setup wizard
```

That's it. Your website is running.

---

## 🚀 Quick Start (No Docker)

**Prerequisites:** Node.js 20+ installed.

```bash
# 1. Install dependencies
npm install

# 2. Initialize the database
npx prisma migrate deploy

# 3. Seed demo data (optional)
npx tsx prisma/seed.ts

# 4. Start the dev server
npm run dev

# 5. Open your browser
#    → http://localhost:3000
#    → Follow the on-screen setup wizard
```

---

## 📖 First-Time Setup

When you open the website for the first time, you'll see a **Setup Wizard** that asks for:

1. **Company Name** — appears on your website header
2. **Admin Email** — your login email
3. **Password** — secure your admin panel

After setup, log in at `/admin/login/` and start managing your site.

---

## 🎛 Admin Panel

| Feature | How to Access |
|---------|--------------|
| Dashboard | `/admin/dashboard/` |
| Products | `/admin/products/` |
| Pages | `/admin/pages/` |
| Blog Posts | `/admin/posts/` |
| Media Library | `/admin/media/` |
| Site Settings | `/admin/settings/` |

---

## 🌐 Custom Domain (Go Live)

Once you're ready to go live with your own domain:

1. **Buy a domain** (e.g., yourcompany.com)
2. **Point DNS** to your server IP
3. **Update Caddyfile** — replace `waimaodadan.com` with your domain
4. **Set port 80 + 443** open in your server firewall
5. **Restart Docker**: `docker compose restart`

Caddy automatically provisions SSL certificates (HTTPS).

---

## ⚙️ Environment Variables

These go in a `.env` file (not needed for Docker — edit `docker-compose.yml` directly):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | Database file path |
| `JWT_SECRET` | auto-generated | Encryption key for logins |

---

## 🗄 Database

By default, the CMS uses **SQLite** — a file-based database that requires zero setup.

- Database file: `prisma/dev.db` (development) or `prisma/data/dev.db` (Docker)
- To reset: delete the `.db` file and restart
- For high-traffic sites: PostgreSQL is available (see `prisma/schema.prisma`)

---

## 📁 Project Structure

```
├── app/                  # Website pages + API routes
│   ├── admin/            # Admin panel
│   ├── api/              # API endpoints
│   ├── products/         # Product pages
│   └── blog/             # Blog pages
├── components/           # Reusable UI components
├── lib/                  # Utilities and helpers
├── prisma/               # Database schema + migrations
│   ├── schema.prisma     # Database structure
│   └── seed.ts           # Demo data
├── public/               # Images, uploads
├── Caddyfile             # Domain + SSL config
├── docker-compose.yml    # Docker setup
└── Dockerfile            # App build
```

---

## 🛠 Customization

All settings are configurable through the **Admin Panel → Settings**:

- Site name, tagline, description (SEO)
- Colors, fonts, button styles
- Header layout, footer content
- Product labels and slugs
- Contact information
- SMTP email (for contact forms)

---

## 🔒 Security

- Admin panel is password-protected (JWT tokens)
- SQLite database is not accessible from the browser
- Caddy automatically enables HTTPS with Let's Encrypt
- Rate limiting on login attempts

---

## ❓ FAQ

**Q: I forgot my admin password.**
A: Go to `/admin/login/forgot-password/` and follow the reset flow (if SMTP is configured). Or ask your developer to reset it via the database.

**Q: How do I add products?**
A: Log in → Products → Add New Product.

**Q: Can I translate my site?**
A: Yes! Go to Settings → Languages to enable languages, then translate your content.

---

## License

Private use. Built for product-based businesses.
