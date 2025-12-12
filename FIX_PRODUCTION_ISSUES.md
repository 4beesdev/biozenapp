# 🔧 Rešavanje Production Problema

## Problem 1: Port 80 je Zauzet

### Proveri Šta Koristi Port 80

```bash
# SSH na production server
ssh root@your-production-ip

# Proveri šta koristi port 80
sudo lsof -i :80
# ILI
sudo netstat -tulpn | grep :80
# ILI
sudo ss -tulpn | grep :80
```

**Mogući uzroci:**
- Nginx koji već radi
- Drugi Docker container
- Stari frontend container koji nije zaustavljen

### Rešenje 1: Zaustavi Proces koji Koristi Port 80

```bash
# Ako je to Nginx (van Docker-a)
sudo systemctl stop nginx
sudo systemctl disable nginx

# ILI ako je to stari container
docker ps | grep 80
docker stop <container-id>
docker rm <container-id>
```

### Rešenje 2: Promeni Port u docker-compose.production.yml

Ako ne možeš da zaustaviš proces na portu 80, promeni port u docker-compose:

```bash
cd /opt/biozenapp
nano docker-compose.production.yml
```

Promeni:
```yaml
frontend:
  ports:
    - "80:80"  # Promeni u "8080:80" ili neki drugi port
```

---

## Problem 2: SPRING_DATASOURCE_PASSWORD Nije Setovan

### Dodaj u .env Fajl

```bash
cd /opt/biozenapp

# Proveri da li postoji .env
cat .env

# Dodaj SPRING_DATASOURCE_PASSWORD (zameni sa tvojom stvarnom lozinkom)
echo "SPRING_DATASOURCE_PASSWORD=tvoja-baza-lozinka-ovde" >> .env

# Proveri da li je dodato
cat .env | grep SPRING_DATASOURCE
```

**Trebalo bi da vidiš:**
```
SPRING_DATASOURCE_URL=...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=tvoja-baza-lozinka-ovde
```

---

## Problem 3: Orphan Container (biozen-postgres)

### Obriši Orphan Container

```bash
cd /opt/biozenapp

# Vidi orphan containere
docker ps -a | grep biozen-postgres

# Zaustavi i obriši orphan container
docker stop biozen-postgres 2>/dev/null
docker rm biozen-postgres 2>/dev/null

# ILI koristi --remove-orphans flag
docker compose -f docker-compose.production.yml up -d --remove-orphans
```

---

## Problem 4: Version Warning u docker-compose.production.yml

### Ukloni Version (Opciono)

```bash
cd /opt/biozenapp
nano docker-compose.production.yml
```

Obriši prvu liniju:
```yaml
version: '3.8'  # OBRISI OVO
```

---

## 🎯 Sve Odjednom - Reši Sve Probleme

```bash
# SSH na production server
ssh root@your-production-ip

# 1. Idi u direktorijum
cd /opt/biozenapp

# 2. Proveri šta koristi port 80
echo "=== PROVERA PORTA 80 ===" && \
sudo lsof -i :80 || sudo netstat -tulpn | grep :80 || echo "Port 80 je slobodan"

# 3. Zaustavi proces na portu 80 (ako postoji)
# (Zameni <process-name> sa imenom procesa koji koristi port 80)
# sudo systemctl stop nginx  # ILI
# docker stop <container-id>

# 4. Obriši orphan container
docker stop biozen-postgres 2>/dev/null
docker rm biozen-postgres 2>/dev/null

# 5. Proveri .env fajl
echo "" && \
echo "=== PROVERA .env FAJLA ===" && \
cat .env | grep -E "SPRING_DATASOURCE|OPENAI|MAIL" || echo "Neki environment variables nedostaju"

# 6. Ako nedostaju, dodaj ih:
# echo "SPRING_DATASOURCE_PASSWORD=tvoja-lozinka" >> .env

# 7. Pull najnovije izmene
git pull origin main

# 8. Rebuild i restart
docker compose -f docker-compose.production.yml build --no-cache backend frontend && \
docker compose -f docker-compose.production.yml down --remove-orphans && \
docker compose -f docker-compose.production.yml up -d

# 9. Proveri status
docker compose -f docker-compose.production.yml ps
```

---

## ✅ Finalna Provera

```bash
# Proveri da li svi containeri rade
docker compose -f docker-compose.production.yml ps

# Proveri logove
docker compose -f docker-compose.production.yml logs backend | tail -30
docker compose -f docker-compose.production.yml logs frontend | tail -30
```

---

## 🐛 Troubleshooting

### Ako port 80 i dalje ne radi:

```bash
# Proveri sve containere
docker ps -a

# Zaustavi sve containere
docker stop $(docker ps -aq)

# Pokreni samo production containere
cd /opt/biozenapp
docker compose -f docker-compose.production.yml up -d
```

### Ako .env fajl ne postoji:

```bash
# Kreiraj .env fajl sa svim potrebnim varijablama
cat > .env << EOF
SPRING_DATASOURCE_URL=jdbc:postgresql://your-db-host:5432/biozenapp
SPRING_DATASOURCE_USERNAME=biozen
SPRING_DATASOURCE_PASSWORD=tvoja-baza-lozinka
JWT_SECRET=tvoj-jwt-secret-min-32-characters
OPENAI_API_KEY=sk-tvoj-openai-api-key
MAIL_PASSWORD=tvoja-email-lozinka
EOF
```

