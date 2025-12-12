# Rebuild Frontend na Production Serveru

## Koraci za rebuild frontend-a

### 1. SSH na production server
```bash
ssh root@164.90.231.47
```

### 2. Idi u direktorijum projekta
```bash
cd /opt/biozenapp
```

### 3. Pull najnovije izmene sa Git-a
```bash
git pull origin main
```

### 4. Rebuild frontend (bez cache-a)
```bash
docker compose -f docker-compose.production.yml build --no-cache frontend
```

### 5. Restart frontend container-a
```bash
docker compose -f docker-compose.production.yml restart frontend
```

### 6. Proveri da li je frontend pokrenut
```bash
docker compose -f docker-compose.production.yml ps
```

### 7. Proveri logove ako ima problema
```bash
docker compose -f docker-compose.production.yml logs frontend --tail=50
```

---

## Alternativno: Sve u jednoj komandi

```bash
ssh root@164.90.231.47 "cd /opt/biozenapp && git pull origin main && docker compose -f docker-compose.production.yml build --no-cache frontend && docker compose -f docker-compose.production.yml restart frontend"
```

---

## Ako ima problema sa build-om

### Proveri da li postoji Dockerfile
```bash
ls -la frontend/Dockerfile
```

### Proveri da li postoji package.json
```bash
ls -la frontend/package.json
```

### Proveri logove build-a
```bash
docker compose -f docker-compose.production.yml build frontend 2>&1 | tail -50
```

---

## Nakon rebuild-a

1. Očisti browser cache (Ctrl+Shift+R ili Cmd+Shift+R)
2. Ili otvori u incognito/private mode
3. Proveri da li se vide nove ikonice (Blog i Chat)

