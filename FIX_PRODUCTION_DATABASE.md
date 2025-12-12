# 🔧 Popravka Production Database Konfiguracije

## Problem

U `.env` fajlu imaš:
- `POSTGRES_PASSWORD=change-this-password` ✅
- `SPRING_DATASOURCE_URL` pokazuje na managed database (ondigitalocean.com) ❌
- `SPRING_DATASOURCE_USERNAME=db` ❌
- `SPRING_DATASOURCE_PASSWORD` nedostaje ❌

Ali u `docker-compose.production.yml` **nema postgres servisa**!

## Rešenje

Dodao sam postgres servis u `docker-compose.production.yml` i konfigurisao backend da koristi lokalnu PostgreSQL bazu.

---

## Korak 1: Pull Najnovije Izmene

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Pull najnovije izmene
git pull origin main
```

---

## Korak 2: Ažuriraj .env Fajl

Treba da ukloniš stare managed database varijable i koristiš samo `POSTGRES_PASSWORD`:

```bash
cd /opt/biozenapp

# Proveri trenutno stanje
cat .env

# Ukloni stare managed database varijable (ako postoje)
# Ne briši POSTGRES_PASSWORD!

# Ako želiš da promeniš password, edituj .env:
nano .env
```

**U `.env` fajlu treba da imaš:**
```bash
# PostgreSQL (lokalna baza u Docker container-u)
POSTGRES_PASSWORD=change-this-password

# ILI ako želiš sigurniji password:
# POSTGRES_PASSWORD=tvoj-siguran-password-ovde

# Ostalo
JWT_SECRET=tvoj-jwt-secret
OPENAI_API_KEY=sk-tvoj-openai-key
MAIL_PASSWORD=tvoja-email-lozinka
REACT_APP_API_URL=https://biozen.rs
```

**Ukloni ove linije (ako postoje):**
- `SPRING_DATASOURCE_URL=jdbc:postgresql://ondigitalocean.com...`
- `SPRING_DATASOURCE_USERNAME=db`
- `SPRING_DATASOURCE_PASSWORD=...`

---

## Korak 3: Rebuild i Restart

```bash
cd /opt/biozenapp

# Rebuild sve (uključujući postgres)
docker compose -f docker-compose.production.yml build --no-cache

# Zaustavi stare containere
docker compose -f docker-compose.production.yml down

# Pokreni nove containere
docker compose -f docker-compose.production.yml up -d

# Proveri status
docker compose -f docker-compose.production.yml ps
```

**Trebalo bi da vidiš:**
```
NAME                  STATUS
biozen-postgres       Up (healthy)
biozen-backend        Up
biozen-frontend       Up
```

---

## Korak 4: Proveri Logove

```bash
# Proveri postgres logove
docker compose -f docker-compose.production.yml logs postgres | tail -20

# Proveri backend logove
docker compose -f docker-compose.production.yml logs backend | tail -30
```

**Traži u backend logovima:**
- `HikariPool-1 - Start completed` ✅ - uspešna konekcija
- `Started MiniAppApplication` ✅ - backend je pokrenut

---

## Korak 5: Proveri da Li Baza Radi

```bash
# Konektuj se na bazu
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp

# U PostgreSQL prompt-u:
# \l  (lista baza)
# \dt  (lista tabela)
# \q  (izlaz)
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Pull najnovije izmene
git pull origin main

# Proveri .env fajl
echo "=== TRENUTNO STANJE .env ===" && \
cat .env | grep -E "POSTGRES|SPRING_DATASOURCE" || echo "Nema database varijabli"

# Rebuild sve
echo "" && \
echo "=== REBUILD ===" && \
docker compose -f docker-compose.production.yml build --no-cache

# Restart
echo "" && \
echo "=== RESTART ===" && \
docker compose -f docker-compose.production.yml down && \
docker compose -f docker-compose.production.yml up -d

# Proveri status
echo "" && \
echo "=== STATUS ===" && \
sleep 5 && \
docker compose -f docker-compose.production.yml ps

# Proveri logove
echo "" && \
echo "=== BACKEND LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs backend | tail -30
```

---

## ⚠️ VAŽNO

1. **Password**: Ako želiš da promeniš `POSTGRES_PASSWORD`, edituj `.env` fajl **PRE** nego što pokreneš containere. Ako već imaš podatke u bazi, ne menjaj password bez backup-a!

2. **Backup**: Ako već imaš podatke u bazi, napravi backup pre nego što restart-uješ:
   ```bash
   # Backup (ako postoji stara baza)
   docker exec biozen-postgres pg_dump -U biozen biozenapp > backup.sql
   ```

3. **Data Persistence**: Podaci će biti sačuvani u Docker volume-u `postgres_data`, tako da neće biti izgubljeni kada restart-uješ containere.

---

## 🐛 Troubleshooting

### Problem: Backend ne može da se konektuje na bazu

```bash
# Proveri da li postgres container radi
docker compose -f docker-compose.production.yml ps postgres

# Proveri postgres logove
docker compose -f docker-compose.production.yml logs postgres

# Proveri da li je postgres healthy
docker compose -f docker-compose.production.yml ps postgres | grep healthy
```

### Problem: "Port 5432 already in use"

```bash
# Proveri šta koristi port 5432
sudo lsof -i :5432

# ILI
sudo netstat -tulpn | grep 5432

# Zaustavi proces koji koristi port 5432
# ILI promeni port u docker-compose.production.yml
```

### Problem: "Volume postgres_data already exists"

```bash
# Obriši stari volume (PAZI - ovo će obrisati podatke!)
docker volume rm biozenapp_postgres_data

# ILI koristi drugo ime za volume u docker-compose.production.yml
```

---

## ✅ Finalna Provera

```bash
# Proveri da li backend radi
curl http://localhost:8080/api/me

# Trebalo bi da vrati JSON
```

---

## 📝 Primer Finalnog .env Fajla

```bash
# PostgreSQL (lokalna baza u Docker container-u)
POSTGRES_PASSWORD=change-this-password

# ILI sigurniji password:
# POSTGRES_PASSWORD=moj-siguran-password-123

# Ostalo
JWT_SECRET=tvoj-jwt-secret-min-32-characters
OPENAI_API_KEY=sk-tvoj-openai-key
MAIL_PASSWORD=tvoja-email-lozinka
REACT_APP_API_URL=https://biozen.rs
```

**Zameni sve `tvoj-...-ovde` sa stvarnim vrednostima!**

