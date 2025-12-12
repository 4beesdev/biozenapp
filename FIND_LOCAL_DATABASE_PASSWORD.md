# 🔍 Kako da Pronađeš Lozinku za Lokalnu Bazu na Droplet-u

Ako nema baze u Digital Ocean Databases sekciji, verovatno koristiš **lokalnu PostgreSQL bazu** na Droplet-u.

---

## Opcija 1: Proveri .env Fajl na Serveru

Password je verovatno već u `.env` fajlu:

```bash
# SSH na production server
ssh root@your-production-ip

# Idi u production direktorijum
cd /opt/biozenapp

# Proveri .env fajl
cat .env

# ILI samo database varijable
cat .env | grep -i "SPRING_DATASOURCE\|DATABASE"
```

**Ako vidiš `SPRING_DATASOURCE_PASSWORD=...` ili `DATABASE_URL=...` u `.env` fajlu, to je to!**

---

## Opcija 2: Proveri Docker Container (Ako Postoji)

Možda postoji stari postgres container:

```bash
# SSH na production server
ssh root@your-production-ip

# Proveri sve containere
docker ps -a | grep postgres

# Ako postoji postgres container, proveri environment variables
docker inspect biozen-postgres | grep -i "POSTGRES_PASSWORD\|POSTGRES_USER"
```

---

## Opcija 3: Proveri Lokalnu PostgreSQL Instalaciju

Ako je PostgreSQL instaliran direktno na serveru (ne kroz Docker):

```bash
# SSH na production server
ssh root@your-production-ip

# Proveri da li je PostgreSQL instaliran
which psql
psql --version

# Proveri da li radi PostgreSQL servis
sudo systemctl status postgresql

# ILI
sudo service postgresql status
```

### Ako je PostgreSQL instaliran, proveri konfiguraciju:

```bash
# Proveri PostgreSQL konfiguraciju
sudo cat /etc/postgresql/*/main/postgresql.conf | grep -i "port\|listen"

# Proveri pg_hba.conf (authentication)
sudo cat /etc/postgresql/*/main/pg_hba.conf

# Pokušaj da se konektuješ kao postgres user
sudo -u postgres psql

# U PostgreSQL prompt-u:
# \l  (lista baza)
# \du  (lista korisnika)
# \q  (izlaz)
```

---

## Opcija 4: Proveri Backend Logove

Backend logovi mogu pokazati kako se konektuje na bazu:

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Proveri backend logove
docker compose -f docker-compose.production.yml logs backend | grep -i "database\|datasource\|jdbc\|postgres"

# ILI sve logove
docker compose -f docker-compose.production.yml logs backend | tail -100
```

**Traži:**
- `JDBC URL: jdbc:postgresql://...`
- `Username: ...`
- `HikariPool-1 - Start completed` (znači da je uspešno povezan)

---

## Opcija 5: Proveri Environment Variables u Container-u

Proveri šta backend container vidi:

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Proveri environment variables u backend container-u
docker compose -f docker-compose.production.yml exec backend env | grep -i "SPRING_DATASOURCE\|DATABASE"
```

**Ako vidiš password ovde, to je to!**

---

## Opcija 6: Kreiraj Novu Bazu (Ako Ne Postoji)

Ako stvarno nema baze, možeš kreirati novu:

### 6.1. Kreiraj Managed Database na Digital Ocean

1. Idi na: https://cloud.digitalocean.com
2. Klikni **Create** → **Databases**
3. Izaberi:
   - **Engine**: PostgreSQL
   - **Version**: 15
   - **Plan**: Basic (najjeftiniji)
   - **Region**: Isti kao tvoj Droplet
4. Klikni **Create Database Cluster**
5. Sačekaj da se kreira (5-10 minuta)
6. Idi na **Connection Details** i kopiraj:
   - Host
   - Port
   - Database
   - Username
   - Password

### 6.2. Dodaj u .env Fajl

```bash
cd /opt/biozenapp

# Dodaj database varijable
cat >> .env << EOF
SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database
SPRING_DATASOURCE_USERNAME=username
SPRING_DATASOURCE_PASSWORD=password
EOF

# Proveri
cat .env | grep SPRING_DATASOURCE
```

**Zameni `host`, `port`, `database`, `username`, `password` sa stvarnim vrednostima iz Digital Ocean.**

---

## 🎯 Sve Odjednom - Copy-Paste Komande

```bash
# SSH na production server
ssh root@your-production-ip

# Idi u production direktorijum
cd /opt/biozenapp

# 1. Proveri .env fajl
echo "=== .env FAJL ===" && \
cat .env | grep -i "SPRING_DATASOURCE\|DATABASE" || echo "Nema database varijabli u .env"

# 2. Proveri postgres containere
echo "" && \
echo "=== POSTGRES CONTAINERS ===" && \
docker ps -a | grep postgres || echo "Nema postgres container-a"

# 3. Proveri lokalnu PostgreSQL instalaciju
echo "" && \
echo "=== LOKALNA POSTGRESQL ===" && \
which psql && psql --version || echo "PostgreSQL nije instaliran"

# 4. Proveri backend environment variables
echo "" && \
echo "=== BACKEND ENV VARIABLES ===" && \
docker compose -f docker-compose.production.yml exec backend env 2>/dev/null | grep -i "SPRING_DATASOURCE\|DATABASE" || echo "Backend container nije pokrenut"

# 5. Proveri backend logove
echo "" && \
echo "=== BACKEND LOGOVI (database info) ===" && \
docker compose -f docker-compose.production.yml logs backend 2>/dev/null | grep -i "jdbc\|datasource\|username\|hikari" | tail -10 || echo "Nema database logova"
```

---

## ✅ Nakon Što Pronađeš Password

Dodaj ga u `.env` fajl (ako već nije tamo):

```bash
cd /opt/biozenapp

# Proveri da li već postoji
cat .env | grep SPRING_DATASOURCE_PASSWORD

# Ako ne postoji, dodaj ga
echo "SPRING_DATASOURCE_PASSWORD=tvoj-password-ovde" >> .env

# Proveri
cat .env | grep SPRING_DATASOURCE
```

---

## 🆘 Ako Ništa Ne Radi

Ako ne možeš da pronađeš password, najlakše je da:

1. **Kreiraš novu managed database** na Digital Ocean (Opcija 6.1)
2. **Ili resetuješ password** ako postoji lokalna instalacija:

```bash
# Resetuj postgres user password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'novi-password';
\q

# Dodaj u .env
cd /opt/biozenapp
echo "SPRING_DATASOURCE_PASSWORD=novi-password" >> .env
```

---

## 📝 Primer .env Fajla

Tvoj `.env` fajl treba da ima:

```bash
# Database (lokalna ILI managed)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/biozenapp
SPRING_DATASOURCE_USERNAME=biozen
SPRING_DATASOURCE_PASSWORD=tvoj-password-ovde

# ILI za managed database:
# SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database
# SPRING_DATASOURCE_USERNAME=username
# SPRING_DATASOURCE_PASSWORD=password

# Ostalo
JWT_SECRET=tvoj-jwt-secret
OPENAI_API_KEY=sk-tvoj-openai-key
MAIL_PASSWORD=tvoja-email-lozinka
REACT_APP_API_URL=https://biozen.rs
```

