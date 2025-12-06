# 🚀 Komande za Deploy na Droplet

## 1. Povuci najnovije izmene sa GitHub-a

```bash
cd /opt/biozenapp
git pull origin main
```

## 2. Rebuild Backend (VAŽNO - da koristi novu konfiguraciju)

```bash
docker compose build --no-cache backend
```

## 3. Restart Aplikacije

```bash
docker compose down
docker compose up -d
```

## 4. Proveri Status

```bash
docker compose ps
```

## 5. Proveri Logove

```bash
docker compose logs -f backend
```

Trebalo bi da vidiš:
- `✓ Using SPRING_DATASOURCE_URL directly`
- `HikariPool-1 - Start completed`
- `Started MiniAppApplication`

## Sve odjednom (Copy-Paste)

```bash
cd /opt/biozenapp && \
git pull origin main && \
docker compose build --no-cache backend && \
docker compose down && \
docker compose up -d && \
docker compose logs -f backend
```

## Ako Git Pull Traži Credentials

Ako te pita za username/password:
- **Username**: tvoj GitHub username
- **Password**: Personal Access Token (ne GitHub password)

## Troubleshooting

### Ako git pull ne radi:
```bash
# Proveri remote
git remote -v

# Force pull (pažljivo!)
git fetch origin
git reset --hard origin/main
```

### Ako build ne radi:
```bash
# Proveri da li postoji backend direktorijum
ls -la backend/

# Proveri Dockerfile
cat backend/Dockerfile
```

### Ako backend i dalje ne radi:
```bash
# Proveri environment varijable
docker compose exec backend env | grep SPRING_DATASOURCE

# Proveri detaljne logove
docker compose logs backend | tail -100
```

