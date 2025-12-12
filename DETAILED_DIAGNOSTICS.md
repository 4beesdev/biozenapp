# 🔍 Detaljna Dijagnostika Server Problema

## Korak 1: Proveri Status Container-a

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Proveri status
docker compose -f docker-compose.production.yml ps -a

# Proveri da li su svi containeri pokrenuti
docker ps -a | grep biozen
```

---

## Korak 2: Proveri Logove (Detaljno)

```bash
# Frontend logovi (poslednjih 50 linija)
docker compose -f docker-compose.production.yml logs frontend --tail=50

# Backend logovi (poslednjih 50 linija)
docker compose -f docker-compose.production.yml logs backend --tail=50

# Postgres logovi
docker compose -f docker-compose.production.yml logs postgres --tail=50
```

---

## Korak 3: Proveri Port 80

```bash
# Proveri šta koristi port 80
sudo lsof -i :80
sudo netstat -tulpn | grep :80
sudo ss -tulpn | grep :80

# Proveri da li frontend container sluša na portu 80
docker compose -f docker-compose.production.yml exec frontend netstat -tulpn | grep 80
```

---

## Korak 4: Proveri Network Connectivity

```bash
# Proveri da li frontend može da se konektuje na backend
docker compose -f docker-compose.production.yml exec frontend ping -c 2 backend

# Proveri da li backend može da se konektuje na postgres
docker compose -f docker-compose.production.yml exec backend ping -c 2 postgres
```

---

## Korak 5: Proveri Disk Space i Memory

```bash
# Disk space
df -h

# Memory
free -h

# Docker disk usage
docker system df
```

---

## Korak 6: Proveri Docker Daemon

```bash
# Proveri da li Docker radi
sudo systemctl status docker

# Proveri Docker version
docker --version
docker compose version
```

---

## Korak 7: Proveri .env Fajl

```bash
# Proveri da li .env fajl postoji i ima sve varijable
cat /opt/biozenapp/.env

# Proveri da li su varijable setovane u container-u
docker compose -f docker-compose.production.yml exec backend env | grep -E "SPRING_DATASOURCE|JWT|OPENAI|MAIL"
```

---

## Korak 8: Test Lokalno (Na Serveru)

```bash
# Test frontend direktno na serveru
curl -v http://localhost:80

# Test backend direktno na serveru
curl -v http://localhost:8080/api/me

# Test sa IP adresom servera
curl -v http://$(hostname -I | awk '{print $1}'):80
```

---

## Korak 9: Proveri Cloudflare Settings

1. Idi na Cloudflare Dashboard
2. Proveri DNS settings - da li je A record postavljen na pravi IP?
3. Proveri SSL/TLS mode - trebalo bi da bude "Full" ili "Flexible"
4. Proveri da li je Proxy status "Proxied" (orange cloud) ili "DNS only" (grey cloud)

---

## Korak 10: Proveri Firewall

```bash
# Proveri firewall status
sudo ufw status
# ILI
sudo iptables -L -n

# Proveri da li su portovi 80 i 8080 otvoreni
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# 1. Status container-a
echo "=== CONTAINER STATUS ===" && \
docker compose -f docker-compose.production.yml ps -a

# 2. Frontend logovi
echo "" && \
echo "=== FRONTEND LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs frontend --tail=50

# 3. Backend logovi
echo "" && \
echo "=== BACKEND LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs backend --tail=50

# 4. Port 80 check
echo "" && \
echo "=== PORT 80 CHECK ===" && \
sudo lsof -i :80 || sudo netstat -tulpn | grep :80 || echo "Port 80 check failed"

# 5. Test lokalno
echo "" && \
echo "=== LOCAL TEST ===" && \
curl -v http://localhost:80 2>&1 | head -20 || echo "Local test failed"

# 6. Disk space
echo "" && \
echo "=== DISK SPACE ===" && \
df -h | head -5

# 7. Memory
echo "" && \
echo "=== MEMORY ===" && \
free -h

# 8. Docker status
echo "" && \
echo "=== DOCKER STATUS ===" && \
sudo systemctl status docker | head -10
```

---

## 🐛 Najčešći Problemi i Rešenja

### Problem 1: Containeri se ne pokreću

```bash
# Restart Docker
sudo systemctl restart docker

# Restart containere
cd /opt/biozenapp
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

### Problem 2: Frontend container se crash-uje

```bash
# Proveri frontend logove
docker compose -f docker-compose.production.yml logs frontend

# Rebuild frontend
docker compose -f docker-compose.production.yml build --no-cache frontend
docker compose -f docker-compose.production.yml up -d frontend
```

### Problem 3: Port 80 je zauzet

```bash
# Zaustavi sve na portu 80
sudo fuser -k 80/tcp

# Restart frontend
docker compose -f docker-compose.production.yml restart frontend
```

### Problem 4: Cloudflare ne može da se poveže

- Proveri da li je server IP tačan u Cloudflare DNS
- Proveri da li je SSL/TLS mode postavljen na "Full" ili "Flexible"
- Proveri da li firewall blokira port 80

---

## 📝 Šta Da Pošalješ

Kada pokreneš dijagnostiku, pošalji mi:
1. Output od `docker compose -f docker-compose.production.yml ps -a`
2. Output od `docker compose -f docker-compose.production.yml logs frontend --tail=50`
3. Output od `curl -v http://localhost:80`
4. Output od `sudo lsof -i :80`

