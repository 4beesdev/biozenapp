# 🔧 Rešavanje: database "biozen" does not exist

## Problem

Backend pokušava da se poveže na bazu `biozen`, ali managed database koristi `defaultdb`.

## Rešenje

### 1. Proveri .env fajl

```bash
cd /opt/biozenapp
cat .env
```

Trebalo bi da vidiš:
```
SPRING_DATASOURCE_URL=jdbc:postgresql://.../defaultdb?sslmode=require
```

### 2. Ako koristi `biozenapp` ili `biozen` u URL-u, promeni na `defaultdb`

```bash
nano .env
```

**Proveri da li je:**
```
SPRING_DATASOURCE_URL=jdbc:postgresql://app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

**Ako nije, zameni sa:**
```
SPRING_DATASOURCE_URL=jdbc:postgresql://app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
SPRING_DATASOURCE_USERNAME=db
SPRING_DATASOURCE_PASSWORD=AVNS_leKihZpiozTScIlVqkT
```

### 3. Proveri da li docker-compose.yml koristi lokalnu bazu

```bash
cat docker-compose.yml | grep -A 5 "SPRING_DATASOURCE_URL"
```

Ako vidiš `jdbc:postgresql://postgres:5432/biozenapp`, to je problem - koristi lokalnu bazu umesto managed.

### 4. Ako koristiš docker-compose.yml sa lokalnom bazom

Treba da koristiš `docker-compose.production.yml` ili da modifikuješ `docker-compose.yml`:

```bash
# Proveri da li postoji production verzija
ls -la docker-compose.production.yml

# Ako postoji, koristi je:
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

### 5. Ako ne postoji docker-compose.production.yml

Kreiraj ga ili modifikuj postojeći `docker-compose.yml`:

```bash
# Backup postojeći
cp docker-compose.yml docker-compose.yml.backup

# Modifikuj backend environment da koristi .env varijable
nano docker-compose.yml
```

U `backend` sekciji, zameni:
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/biozenapp
```

Sa:
```yaml
environment:
  SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL}
  SPRING_DATASOURCE_USERNAME: ${SPRING_DATASOURCE_USERNAME}
  SPRING_DATASOURCE_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}
```

I ukloni `depends_on: postgres` iz backend sekcije.

### 6. Restart aplikacije

```bash
docker compose down
docker compose up -d
docker compose logs -f backend
```

## Brzo Rešenje - Sve odjednom

```bash
cd /opt/biozenapp

# 1. Proveri .env
cat .env | grep SPRING_DATASOURCE_URL

# 2. Ako ne koristi defaultdb, popravi
nano .env
# Proveri da URL završava sa /defaultdb?sslmode=require

# 3. Proveri docker-compose.yml
cat docker-compose.yml | grep -A 3 "SPRING_DATASOURCE_URL"

# 4. Ako koristi lokalnu bazu, modifikuj ili koristi production verziju
# (vidi korake iznad)

# 5. Restart
docker compose down
docker compose up -d
docker compose logs -f backend
```

