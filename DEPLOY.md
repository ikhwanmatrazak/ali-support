# Ali Support — Deployment Guide (Dokploy)

## Prerequisites
- Dokploy running at https://dokploy.lightningcloud.my
- Domain `ali-support.lightningcloud.my` pointed to your VPS IP
- Git repo pushed (GitHub / GitLab / any remote)

---

## Step 1 — Push code to a Git remote

```bash
cd /Users/ikhwanmr/Projects/ali-support
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-or-gitlab-repo-url>
git push -u origin main
```

---

## Step 2 — Create a new Compose Application in Dokploy

1. Open https://dokploy.lightningcloud.my/dashboard/home
2. Click **New Project** → give it a name, e.g. `ali-support`
3. Inside the project, click **New Service** → choose **Compose**
4. Connect your Git repository and set the **branch** to `main`
5. Set the **Docker Compose file** path to `docker-compose.yml`

---

## Step 3 — Set Environment Variables in Dokploy

In the Compose service → **Environment** tab, paste the following (fill in real values):

```
DB_ROOT_PASSWORD=your_strong_root_pw
DB_NAME=ali_support
DB_USER=ali_user
DB_PASSWORD=your_strong_db_pw
DB_HOST=mariadb
DB_PORT=3306

SECRET_KEY=your_min_32_char_random_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=480

BRIDGE_PORT=3001
BRIDGE_SECRET=your_bridge_secret
BACKEND_WEBHOOK_URL=http://backend:8000/webhook/whatsapp/incoming

WHATSAPP_BRIDGE_URL=http://whatsapp-bridge:3001
WHATSAPP_BRIDGE_SECRET=your_bridge_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM=Ali Support <your_gmail@gmail.com>

NEXT_PUBLIC_API_URL=https://ali-support.lightningcloud.my/api
NEXT_PUBLIC_WS_URL=wss://ali-support.lightningcloud.my/api/ws
MEDIA_BASE_URL=https://ali-support.lightningcloud.my/media
```

---

## Step 4 — Configure Domain in Dokploy

1. In the Compose service → **Domains** tab
2. Add domain: `ali-support.lightningcloud.my`
3. Set **Port** to `80`  (Nginx container exposes 80 → Dokploy handles SSL termination, or let Nginx handle it)
4. Enable **HTTPS / Let's Encrypt** — Dokploy will auto-issue the cert

> **Option A (recommended):** Let Dokploy handle SSL. Remove the HTTPS server block from `nginx/nginx.conf`
> and keep only the HTTP block. Dokploy's Traefik proxy will terminate SSL.
>
> **Option B:** Manage certs yourself in `nginx/ssl/` and use the full nginx.conf as-is.

---

## Step 5 — Deploy

Click **Deploy** in Dokploy. It will:
1. Clone your repo
2. Run `docker compose up -d --build`
3. All 5 services start: mariadb, backend, whatsapp-bridge, frontend, nginx

---

## Step 6 — Scan WhatsApp QR

1. Open `https://ali-support.lightningcloud.my`
2. Log in with: `admin@ali-support.my` / `Admin@1234`
3. Go to **Settings** — you'll see the WhatsApp QR code
4. Scan it with your WhatsApp phone (Linked Devices → Link a Device)
5. Done — the bridge will stay connected and auto-reconnect if it drops

**Important:** Change your admin password immediately after first login!

---

## Step 7 — Get a dedicated WhatsApp number

For production use, get a SIM card that is not linked to any personal WhatsApp account.
Register it on WhatsApp, then scan the QR in Step 6.

---

## Updating the App

After pushing new code to `main`:
1. In Dokploy → your compose service → click **Redeploy**
2. Or enable **Auto Deploy** from the Git webhook settings in Dokploy

---

## Default Credentials (change immediately!)

| Item | Value |
|------|-------|
| Admin email | admin@ali-support.my |
| Admin password | Admin@1234 |
| DB user | ali_user |
| DB password | (set in env) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| WhatsApp shows "not connected" | Check bridge logs in Dokploy → service logs |
| QR not showing | Restart whatsapp-bridge service, wait 30s, refresh Settings page |
| Backend 500 errors | Check backend logs — usually a DB connection issue on cold start |
| Tickets not created | Check webhook route `/api/webhook/whatsapp/incoming` and BRIDGE_SECRET match |
