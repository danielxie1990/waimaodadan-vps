# Deployment Guide — Hostinger Node.js Hosting

## Step 1: Prepare the server

Login to Hostinger hPanel → **Node.js** → **Create project**:

| Field | Value |
|-------|-------|
| Project name | `gytinbox` |
| Root directory | `public_html` |
| Node.js version | **20.x** or **18.x** |
| Entry point | `node_modules/.bin/next` |
| Application mode | **Production** |

Then click **Create**.

## Step 2: Upload files

Upload the contents of `deploy-source.zip` to the **`public_html`** folder via FTP.

Files to upload (no need to upload node_modules or .next — the server builds these):

```
/public_html/
├── .env
├── package.json
├── package-lock.json
├── next.config.js
├── tsconfig.json
├── postcss.config.js
├── tailwind.config.js
├── public/          ← images, uploads
├── components/      ← React components
├── app/             ← Next.js pages
├── lib/             ← utilities
└── updates/         ← version manifest
```

## Step 3: Install & Build

In Hostinger hPanel → **Node.js** → **Restart** → The system will auto-run:

```bash
npm install --production
npx prisma generate
npm run build
```

This creates the SQLite database (`prisma/dev.db`).

## Step 4: First admin setup

Visit your site at `https://fulimachine.com/`.

- Go to `https://fulimachine.com/admin/login/`
- First visit will auto-create the admin account
- Default credentials will be shown on first load

## Step 5: Verify

- ✅ Frontend loads correctly
- ✅ Admin login works
- ✅ Products / Pages / Media / Menu CRUD
- ✅ File uploads to `/uploads/`

## Troubleshooting

**Error: Cannot find module 'prisma'**
→ Run `npx prisma generate` in Hostinger's Node.js console

**Error: SQLITE_CANTOPEN**
→ The `prisma/dev.db` file needs write permission

**500 error on admin pages**
→ Check Node.js version (must be 18+)
→ Check `.env` file is present
