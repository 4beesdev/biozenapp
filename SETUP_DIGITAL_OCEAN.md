# Setup Digital Ocean - 3 Koraka

## ✅ Status

- ✅ Aplikacija je dokerizovana
- ✅ Dockerfile-ovi su spremni
- ✅ `app.yaml` je konfigurisan
- ✅ Kod je na GitHub-u

## ⚠️ Šta treba da uradiš (3 minuta):

### 1. Otvori Digital Ocean Dashboard
- https://cloud.digitalocean.com
- Apps → `biozenapp` → **Settings**

### 2. Dodaj Environment Variables

Scroll do **App-Level Environment Variables** i dodaj:

#### a) DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Tvoj connection string (format: `postgresql://username:password@host:port/database?sslmode=require`)
- **Scope**: RUN_TIME
- **Type**: Secret

#### b) APP_JWT_SECRET
- **Key**: `APP_JWT_SECRET`
- **Value**: Generiši sa `openssl rand -base64 32`
- **Scope**: RUN_TIME
- **Type**: Secret

### 3. Redeploy
- **Deployments** tab → **Create Deployment**

## 🎯 Zašto ovo?

- GitHub automatski blokira password-e u kodu (sigurnosni razlog)
- Standardna praksa: password-i se setuju kroz environment variables
- Digital Ocean će automatski koristiti ove varijable

## ✅ Nakon ovoga

Digital Ocean će:
1. Detektovati promene na GitHub-u
2. Build-ovati Docker image-e
3. Deploy-ovati aplikaciju
4. Koristiti environment variables koje si setovao

