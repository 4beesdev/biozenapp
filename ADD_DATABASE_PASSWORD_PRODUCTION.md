# 🔑 Dodavanje SPRING_DATASOURCE_PASSWORD u Production .env

## Problem

U `.env` fajlu imaš:
- ✅ `SPRING_DATASOURCE_URL`
- ✅ `SPRING_DATASOURCE_USERNAME=db`
- ❌ **NEDOSTAJE** `SPRING_DATASOURCE_PASSWORD`

## Rešenje: Pronađi Password u Digital Ocean Dashboard

### Korak 1: Otvori Digital Ocean Dashboard

1. Idi na: https://cloud.digitalocean.com
2. Uloguj se

### Korak 2: Pronađi Bazu

Pošto vidiš `ondigitalocean.com` u connection string-u, ovo je **managed database**.

**Opcija A: Kroz Apps**
1. Idi na **Apps** u levom meniju
2. Klikni na tvoju aplikaciju (`biozenapp`)
3. Idi na **Components** tab
4. Traži **Database** komponentu
5. Klikni na nju

**Opcija B: Direktno kroz Databases**
1. Idi na **Databases** u levom meniju
2. Traži bazu koja se zove:
   - `app-dd78834a-f1da-4757-9a71-793e8b2ab270` (iz connection string-a)
   - ILI neka druga baza koja pripada tvojoj aplikaciji

### Korak 3: Otvori Connection Details

1. Klikni na bazu
2. Idi na **Connection Details** tab
3. Tu ćeš videti:
   - **Host**: `app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com`
   - **Port**: `25060`
   - **Database**: `defaultdb`
   - **Username**: `db`
   - **Password**: ← **OVO JE ONO ŠTO TRAŽIŠ!**
   - **SSL Mode**: `require`

### Korak 4: Kopiraj Password

1. Klikni na **Show** pored Password polja
2. Kopiraj password

---

## Korak 5: Dodaj Password u .env Fajl

```bash
# SSH na production server
ssh root@your-production-ip

# Idi u production direktorijum
cd /opt/biozenapp

# Dodaj password (ZAMENI sa tvojim stvarnim password-om iz Digital Ocean)
echo "SPRING_DATASOURCE_PASSWORD=tvoj-password-ovde" >> .env

# Proveri da li je dodato
cat .env | grep SPRING_DATASOURCE
```

**Trebalo bi da vidiš:**
```
SPRING_DATASOURCE_URL=jdbc:postgresql://app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
SPRING_DATASOURCE_USERNAME=db
SPRING_DATASOURCE_PASSWORD=tvoj-password-ovde
```

---

## Korak 6: Restart Backend Container

Nakon što dodaš password, restart-uj backend da učita novu vrednost:

```bash
cd /opt/biozenapp

# Restart backend
docker compose -f docker-compose.production.yml restart backend

# Proveri logove - trebalo bi da vidiš uspešnu konekciju
docker compose -f docker-compose.production.yml logs backend | tail -30
```

**Traži u logovima:**
- `HikariPool-1 - Start completed` - znači da je uspešno povezan
- `Started MiniAppApplication` - backend je pokrenut

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip

# Idi u production direktorijum
cd /opt/biozenapp

# 1. Proveri trenutno stanje
echo "=== TRENUTNO STANJE ===" && \
cat .env | grep SPRING_DATASOURCE

# 2. Dodaj password (ZAMENI sa tvojim stvarnim password-om)
# echo "SPRING_DATASOURCE_PASSWORD=tvoj-password-ovde" >> .env

# 3. Proveri da li je dodato
echo "" && \
echo "=== NAKON DODAVANJA ===" && \
cat .env | grep SPRING_DATASOURCE

# 4. Restart backend
echo "" && \
echo "=== RESTART BACKEND ===" && \
docker compose -f docker-compose.production.yml restart backend

# 5. Proveri logove
echo "" && \
echo "=== BACKEND LOGOVI ===" && \
sleep 5 && \
docker compose -f docker-compose.production.yml logs backend | tail -30
```

---

## ⚠️ VAŽNO

1. **Password je osetljiv podatak** - ne deli ga javno
2. **Ne commit-uj `.env` fajl** u git (trebalo bi da je u `.gitignore`)
3. **Zapamti password** - možda ćeš ga trebati kasnije

---

## 🐛 Troubleshooting

### Problem: Backend i dalje ne može da se poveže

```bash
# Proveri da li je password u container-u
docker compose -f docker-compose.production.yml exec backend env | grep SPRING_DATASOURCE_PASSWORD

# Ako ne vidiš password, proveri da li je .env fajl pravilno učitan
cat /opt/biozenapp/.env | grep SPRING_DATASOURCE_PASSWORD
```

### Problem: Ne možeš da pronađeš bazu u Dashboard-u

1. Proveri da li si na pravom Digital Ocean nalogu
2. Proveri da li je baza možda u drugom regionu
3. Proveri da li je baza možda obrisana (trebalo bi da vidiš grešku u logovima)

---

## ✅ Finalna Provera

```bash
# Proveri da li backend radi
curl http://localhost:8080/api/me

# Trebalo bi da vrati JSON (čak i ako nisi ulogovan)
```

---

## 📝 Primer Finalnog .env Fajla

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
SPRING_DATASOURCE_USERNAME=db
SPRING_DATASOURCE_PASSWORD=tvoj-password-ovde
JWT_SECRET=tvoj-jwt-secret
OPENAI_API_KEY=sk-tvoj-openai-key
MAIL_PASSWORD=tvoja-email-lozinka
REACT_APP_API_URL=https://biozen.rs
```

**Zameni sve `tvoj-...-ovde` sa stvarnim vrednostima!**

