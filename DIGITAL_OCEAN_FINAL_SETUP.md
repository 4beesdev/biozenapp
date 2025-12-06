# Finalni Setup za Digital Ocean - 2 Koraka

## ✅ Šta je već urađeno:

1. ✅ Aplikacija je dokerizovana (Dockerfile-ovi za backend i frontend)
2. ✅ Docker Compose konfiguracija postoji
3. ✅ `app.yaml` je konfigurisan
4. ✅ `DatabaseConfig.java` automatski parsira DATABASE_URL
5. ✅ Sve je push-ovano na GitHub

## ⚠️ Šta treba da uradiš (2 minuta):

### Korak 1: Setuj DATABASE_URL u Digital Ocean

1. **Otvori Digital Ocean Dashboard**
   - https://cloud.digitalocean.com
   - Apps → `biozenapp` → **Settings**

2. **Dodaj Environment Variable**
   - Scroll do **App-Level Environment Variables**
   - Klikni **Edit** ili **Add Variable**
   - **Key**: `DATABASE_URL`
   - **Value**: 
     ```
     postgresql://db:AVNS_leKihZpiozTScIlVqkT@app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
     ```
   - **Scope**: RUN_TIME
   - **Type**: Secret (ako je opcija dostupna)
   - **Save**

### Korak 2: Setuj APP_JWT_SECRET

1. **U istom prozoru (Environment Variables)**
   - **Key**: `APP_JWT_SECRET`
   - **Value**: Generiši sa `openssl rand -base64 32` (ili bilo koji string min 32 karaktera)
   - **Scope**: RUN_TIME
   - **Type**: Secret
   - **Save**

### Korak 3: Redeploy

1. **Deployments** tab → **Create Deployment**

## 🎯 Zašto ovo?

- **GitHub blokira password-e u kodu** (sigurnosni razlog)
- **Digital Ocean ne expanduje `${db.DATABASE_URL}`** automatski
- **Standardna praksa**: Password-i se setuju kroz environment variables, ne u kod

## ✅ Nakon ovoga:

Digital Ocean će automatski:
1. Detektovati promene na GitHub-u
2. Build-ovati Docker image-e
3. Deploy-ovati aplikaciju
4. Koristiti environment variables koje si setovao

## 🧪 Lokalno testiranje:

Ako želiš da testiraš lokalno:

```bash
# Kreiraj .env fajl
cd /Users/andrejdzakovic/Dropbox/BioZen/biozenapp
cat > .env << EOF
POSTGRES_PASSWORD=test123
JWT_SECRET=test-secret-key-minimum-32-characters-long
EOF

# Pokreni sve
docker compose up -d

# Frontend: http://localhost
# Backend: http://localhost:8080
```

## 📝 Provera:

Nakon deployment-a, proveri Runtime Logs:
- Trebalo bi da vidiš: `✓ Parsed DATABASE_URL successfully:`
- Aplikacija bi trebalo da se pokrene bez grešaka

