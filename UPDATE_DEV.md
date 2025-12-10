# Ažuriranje Dev Verzije na Digital Ocean

## Brzi vodič za ažuriranje postojećeg dev projekta

### 1. SSH na server

```bash
ssh root@164.90.231.47
```

### 2. Idi u dev folder i pull najnovije izmene

```bash
cd /opt/biozenapp-dev
git pull origin dev
```

### 3. Rebuild i restart servisa

```bash
# Rebuild backend i frontend
docker compose -f docker-compose.dev.yml build --no-cache

# Restart servisa
docker compose -f docker-compose.dev.yml up -d

# Proveri status
docker compose -f docker-compose.dev.yml ps
```

### 4. Proveri logove (ako ima problema)

```bash
# Backend logovi
docker compose -f docker-compose.dev.yml logs -f backend-dev

# Frontend logovi
docker compose -f docker-compose.dev.yml logs -f frontend-dev

# Svi logovi
docker compose -f docker-compose.dev.yml logs -f
```

### 5. Proveri da li radi

```bash
# Backend health check
curl http://localhost:8082/actuator/health

# Frontend
curl http://localhost:8083
```

Otvori u browseru: `http://dev.biozen.rs`

---

## Ako ima problema

### Problem: Portovi zauzeti

```bash
# Proveri šta koristi portove
netstat -tulpn | grep -E "8082|8083|5433"

# Zaustavi stare kontejnere
docker compose -f docker-compose.dev.yml down

# Pokreni ponovo
docker compose -f docker-compose.dev.yml up -d
```

### Problem: Baza ne radi

```bash
# Proveri PostgreSQL logove
docker compose -f docker-compose.dev.yml logs postgres-dev

# Restart PostgreSQL
docker compose -f docker-compose.dev.yml restart postgres-dev
```

### Problem: Nginx ne radi

```bash
# Proveri Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl reload nginx

# Proveri Nginx logove
sudo tail -f /var/log/nginx/error.log
```

---

## Kompletan workflow

1. **Lokalno** - napravi izmene i push na dev:
   ```bash
   git checkout dev
   # napravi izmene
   git add .
   git commit -m "Opis izmena"
   git push origin dev
   ```

2. **Na serveru** - pull i deploy:
   ```bash
   cd /opt/biozenapp-dev
   git pull origin dev
   docker compose -f docker-compose.dev.yml build --no-cache
   docker compose -f docker-compose.dev.yml up -d
   ```

3. **Proveri** - otvori `http://dev.biozen.rs` u browseru

