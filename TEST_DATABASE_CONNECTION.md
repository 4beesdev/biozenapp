# 🧪 Testiranje Database Konekcije - Pronađi Tip Baze

## Test 1: Proveri da Li Postoji Lokalna PostgreSQL

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Proveri da li je PostgreSQL instaliran lokalno
echo "=== TEST 1: LOKALNA POSTGRESQL ===" && \
which psql && psql --version || echo "PostgreSQL nije instaliran lokalno"

# Proveri da li radi PostgreSQL servis
echo "" && \
echo "=== POSTGRESQL SERVIS ===" && \
sudo systemctl status postgresql 2>/dev/null | head -5 || echo "PostgreSQL servis nije pokrenut"
```

---

## Test 2: Proveri Docker Containere

```bash
# Proveri da li postoji postgres container
echo "=== TEST 2: POSTGRES CONTAINER ===" && \
docker ps -a | grep postgres || echo "Nema postgres container-a"

# Ako postoji, proveri environment variables
if docker ps -a | grep -q postgres; then
    echo "" && \
    echo "=== POSTGRES CONTAINER ENV ===" && \
    docker inspect $(docker ps -a | grep postgres | awk '{print $1}') | grep -i "POSTGRES_PASSWORD\|POSTGRES_USER" | head -5
fi
```

---

## Test 3: Proveri Backend Logove (Šta Se Dešava)

```bash
# Proveri backend logove - da li se konektuje na bazu
echo "=== TEST 3: BACKEND LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs backend 2>/dev/null | grep -i "database\|datasource\|jdbc\|hikari\|postgres\|connection" | tail -20 || echo "Backend container nije pokrenut"
```

---

## Test 4: Pokušaj Konekciju na Lokalnu Bazu (Bez Password-a)

```bash
# Pokušaj da se konektuješ na lokalnu bazu (ako postoji)
echo "=== TEST 4: KONEKCIJA NA LOKALNU BAZU ===" && \
if which psql > /dev/null 2>&1; then
    # Pokušaj sa default postgres user-om
    sudo -u postgres psql -c "SELECT version();" 2>&1 | head -3 || echo "Ne može da se konektuje kao postgres user"
    
    # Proveri da li postoji biozenapp baza
    echo "" && \
    echo "=== LISTA BAZA ===" && \
    sudo -u postgres psql -c "\l" 2>&1 | grep -i "biozen\|defaultdb" || echo "Nema biozen baze"
    
    # Proveri da li postoji biozen user
    echo "" && \
    echo "=== LISTA KORISNIKA ===" && \
    sudo -u postgres psql -c "\du" 2>&1 | grep -i "biozen\|db" || echo "Nema biozen user-a"
else
    echo "PostgreSQL nije instaliran lokalno"
fi
```

---

## Test 5: Proveri Environment Variables u Backend Container-u

```bash
# Proveri šta backend container vidi
echo "=== TEST 5: BACKEND ENV VARIABLES ===" && \
docker compose -f docker-compose.production.yml exec backend env 2>/dev/null | grep -i "SPRING_DATASOURCE\|DATABASE" || echo "Backend container nije pokrenut"
```

---

## Test 6: Pokušaj Konekciju na Managed Database (Iz Connection String-a)

```bash
# Iz connection string-a vidimo:
# Host: app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com
# Port: 25060
# Database: defaultdb
# Username: db

# Proveri da li možemo da ping-ujemo host
echo "=== TEST 6: PING MANAGED DATABASE HOST ===" && \
ping -c 2 app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com 2>&1 | head -5 || echo "Ne može da ping-uje host"
```

---

## Test 7: Proveri Backend Greške (Ako Ne Može da Se Konektuje)

```bash
# Proveri da li backend ima greške pri konekciji
echo "=== TEST 7: BACKEND GREŠKE ===" && \
docker compose -f docker-compose.production.yml logs backend 2>/dev/null | grep -i "error\|exception\|failed\|connection refused\|authentication" | tail -10 || echo "Nema grešaka u logovima"
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Test 1: Lokalna PostgreSQL
echo "=== TEST 1: LOKALNA POSTGRESQL ===" && \
which psql && psql --version || echo "PostgreSQL nije instaliran lokalno" && \
echo "" && \
sudo systemctl status postgresql 2>/dev/null | head -5 || echo "PostgreSQL servis nije pokrenut"

# Test 2: Postgres Container
echo "" && \
echo "=== TEST 2: POSTGRES CONTAINER ===" && \
docker ps -a | grep postgres || echo "Nema postgres container-a"

# Test 3: Backend Logovi
echo "" && \
echo "=== TEST 3: BACKEND LOGOVI (database info) ===" && \
docker compose -f docker-compose.production.yml logs backend 2>/dev/null | grep -i "database\|datasource\|jdbc\|hikari\|postgres\|connection" | tail -20 || echo "Backend container nije pokrenut"

# Test 4: Konekcija na Lokalnu Bazu
echo "" && \
echo "=== TEST 4: KONEKCIJA NA LOKALNU BAZU ===" && \
if which psql > /dev/null 2>&1; then
    sudo -u postgres psql -c "SELECT version();" 2>&1 | head -3 || echo "Ne može da se konektuje"
    echo "" && \
    echo "Lista baza:" && \
    sudo -u postgres psql -c "\l" 2>&1 | grep -i "biozen\|defaultdb" || echo "Nema biozen baze"
else
    echo "PostgreSQL nije instaliran lokalno"
fi

# Test 5: Backend Env Variables
echo "" && \
echo "=== TEST 5: BACKEND ENV VARIABLES ===" && \
docker compose -f docker-compose.production.yml exec backend env 2>/dev/null | grep -i "SPRING_DATASOURCE\|DATABASE" || echo "Backend container nije pokrenut"

# Test 6: Ping Managed Database Host
echo "" && \
echo "=== TEST 6: PING MANAGED DATABASE HOST ===" && \
ping -c 2 app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com 2>&1 | head -5 || echo "Ne može da ping-uje host"

# Test 7: Backend Greške
echo "" && \
echo "=== TEST 7: BACKEND GREŠKE ===" && \
docker compose -f docker-compose.production.yml logs backend 2>/dev/null | grep -i "error\|exception\|failed\|connection refused\|authentication" | tail -10 || echo "Nema grešaka"
```

---

## 📊 Analiza Rezultata

### Ako vidiš "PostgreSQL nije instaliran lokalno":
- ❌ Nije lokalna baza
- ✅ Verovatno je managed database

### Ako vidiš postgres container:
- ✅ Možda je Docker-based baza
- Proveri environment variables u container-u

### Ako backend logovi pokazuju "HikariPool-1 - Start completed":
- ✅ Backend se uspešno konektuje na bazu
- Možda password nije potreban (ako je setovan na drugi način)

### Ako backend logovi pokazuju "Connection refused" ili "Authentication failed":
- ❌ Backend ne može da se konektuje
- Treba password ili druga konfiguracija

### Ako ping na managed database host radi:
- ✅ Managed database host je dostupan
- Treba password iz Digital Ocean Dashboard-a

---

## 🔍 Šta Dalje?

Nakon što pokreneš testove, javi mi rezultate i videćemo:
1. Da li je lokalna baza
2. Da li je managed database
3. Da li backend može da se konektuje
4. Šta treba da popravimo

