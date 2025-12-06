# 🔄 Kako da Redeploy-uješ Aplikaciju na Droplet-u

## Brzi Redeploy (Ako nema izmena u kodu)

```bash
cd /opt/biozenapp
docker compose down
docker compose up -d
```

## Potpuni Redeploy (Sa rebuild-om)

```bash
cd /opt/biozenapp

# 1. Zaustavi aplikaciju
docker compose down

# 2. Rebuild Docker image-e (ako ima izmena u kodu)
docker compose build --no-cache

# 3. Pokreni aplikaciju
docker compose up -d

# 4. Proveri status
docker compose ps

# 5. Proveri logove
docker compose logs -f backend
```

## Redeploy sa Git Pull

```bash
cd /opt/biozenapp

# 1. Povuci najnovije izmene
git pull origin main

# 2. Zaustavi aplikaciju
docker compose down

# 3. Rebuild
docker compose build

# 4. Pokreni
docker compose up -d

# 5. Proveri
docker compose ps
docker compose logs -f
```

## Restart Samo Jednog Servisa

```bash
# Restart samo backend-a
docker compose restart backend

# Restart samo frontend-a
docker compose restart frontend
```

## Provera Statusa

```bash
# Status svih servisa
docker compose ps

# Logovi backend-a
docker compose logs backend | tail -50

# Logovi frontend-a
docker compose logs frontend | tail -50

# Sve logove u realnom vremenu
docker compose logs -f
```

## Ako Nešto Ne Radi

```bash
# 1. Zaustavi sve
docker compose down

# 2. Proveri da li su containeri zaustavljeni
docker ps -a

# 3. Obriši stare container-e (pažljivo!)
docker compose down -v  # Obriše i volume-e!

# 4. Rebuild od nule
docker compose build --no-cache

# 5. Pokreni
docker compose up -d
```

## Provera da li Aplikacija Radi

```bash
# Testiraj backend direktno
curl http://localhost:8080/actuator/health

# Testiraj kroz Nginx
curl http://localhost/api/actuator/health

# Proveri u browser-u
# http://Tvoja_IP_Adresa
```

