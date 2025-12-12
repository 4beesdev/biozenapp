# 🚨 Rešavanje "Web Server is Down" (Error 521)

## Problem

Cloudflare Error 521 - "Web server is down" znači da Cloudflare ne može da se poveže sa origin serverom (tvojim Droplet-om).

## Brza Dijagnostika

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# 1. Proveri status container-a
echo "=== CONTAINER STATUS ===" && \
docker compose -f docker-compose.production.yml ps

# 2. Proveri da li frontend radi
echo "" && \
echo "=== FRONTEND TEST ===" && \
curl -s http://localhost:80 | head -5 || echo "Frontend ne odgovara"

# 3. Proveri da li backend radi
echo "" && \
echo "=== BACKEND TEST ===" && \
curl -s http://localhost:8080/api/me | head -5 || echo "Backend ne odgovara"

# 4. Proveri logove za greške
echo "" && \
echo "=== FRONTEND LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs frontend | tail -20

# 5. Proveri backend logove
echo "" && \
echo "=== BACKEND LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs backend | tail -20
```

---

## Rešenje 1: Restart Container-a

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Restart sve containere
docker compose -f docker-compose.production.yml restart

# ILI potpuni restart
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d

# Proveri status
docker compose -f docker-compose.production.yml ps
```

---

## Rešenje 2: Proveri Port 80

```bash
# Proveri šta koristi port 80
sudo lsof -i :80
# ILI
sudo netstat -tulpn | grep :80

# Ako je zauzet, zaustavi proces
sudo fuser -k 80/tcp

# Restart frontend
docker compose -f docker-compose.production.yml restart frontend
```

---

## Rešenje 3: Proveri Disk Space

```bash
# Proveri da li ima dovoljno prostora
df -h

# Proveri Docker disk usage
docker system df
```

---

## Rešenje 4: Proveri Memory

```bash
# Proveri memory usage
free -h

# Proveri Docker stats
docker stats --no-stream
```

---

## Rešenje 5: Proveri Cloudflare Settings

1. Idi na Cloudflare Dashboard
2. Proveri da li je DNS pravilno konfigurisan
3. Proveri da li je SSL/TLS mode postavljen na "Flexible" ili "Full"
4. Proveri da li je Origin Server IP tačan

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# 1. Proveri status
echo "=== CONTAINER STATUS ===" && \
docker compose -f docker-compose.production.yml ps

# 2. Proveri port 80
echo "" && \
echo "=== PORT 80 CHECK ===" && \
sudo lsof -i :80 || echo "Port 80 je slobodan"

# 3. Restart sve
echo "" && \
echo "=== RESTART ===" && \
docker compose -f docker-compose.production.yml down && \
docker compose -f docker-compose.production.yml up -d

# 4. Sačekaj 10 sekundi
echo "" && \
echo "=== WAITING 10 SECONDS ===" && \
sleep 10

# 5. Proveri status ponovo
echo "" && \
echo "=== STATUS AFTER RESTART ===" && \
docker compose -f docker-compose.production.yml ps

# 6. Proveri frontend
echo "" && \
echo "=== FRONTEND TEST ===" && \
curl -s http://localhost:80 | head -5 || echo "Frontend ne odgovara"

# 7. Proveri logove
echo "" && \
echo "=== FRONTEND LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs frontend | tail -20
```

---

## 🐛 Troubleshooting

### Problem: Containeri se ne pokreću

```bash
# Proveri Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Pokreni containere ponovo
cd /opt/biozenapp
docker compose -f docker-compose.production.yml up -d
```

### Problem: Frontend container se crash-uje

```bash
# Proveri frontend logove
docker compose -f docker-compose.production.yml logs frontend

# Proveri da li je build uspešan
docker compose -f docker-compose.production.yml build --no-cache frontend
docker compose -f docker-compose.production.yml up -d frontend
```

### Problem: Backend container se crash-uje

```bash
# Proveri backend logove
docker compose -f docker-compose.production.yml logs backend

# Proveri da li je baza dostupna
docker compose -f docker-compose.production.yml ps postgres
```

---

## ✅ Provera Nakon Popravke

```bash
# Proveri da li sve radi
curl http://localhost:80
curl http://localhost:8080/api/me

# Proveri u browseru
# Otvori http://your-server-ip ili http://app.biozen.rs
```

---

## 📝 Napomene

1. **Cloudflare Error 521** obično znači da origin server ne odgovara
2. **Proveri da li su containeri pokrenuti** - to je najčešći uzrok
3. **Proveri port 80** - možda je zauzet
4. **Proveri logove** - mogu pokazati uzrok problema

