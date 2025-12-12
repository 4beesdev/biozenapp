# 🔧 Rešavanje Problema sa Portom 80

## Problem

Port 80 je zauzet - nešto drugo već koristi ovaj port.

## Rešenje

### Korak 1: Proveri Šta Koristi Port 80

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Proveri šta koristi port 80
sudo lsof -i :80
# ILI
sudo netstat -tulpn | grep :80
# ILI
sudo ss -tulpn | grep :80
```

---

### Korak 2: Zaustavi Proces koji Koristi Port 80

**Ako je to Nginx (van Docker-a):**
```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

**Ako je to stari container:**
```bash
docker ps | grep 80
docker stop <container-id>
docker rm <container-id>
```

**Ako je to neki drugi proces:**
```bash
# Zaustavi sve procese na portu 80
sudo fuser -k 80/tcp
```

---

### Korak 3: Restart Docker Containere

```bash
cd /opt/biozenapp

# Zaustavi sve containere
docker compose -f docker-compose.production.yml down

# Pokreni ponovo
docker compose -f docker-compose.production.yml up -d

# Proveri status
docker compose -f docker-compose.production.yml ps
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# 1. Proveri šta koristi port 80
echo "=== PROVERA PORTA 80 ===" && \
sudo lsof -i :80 || sudo netstat -tulpn | grep :80 || sudo ss -tulpn | grep :80 || echo "Port 80 je slobodan"

# 2. Zaustavi Nginx (ako postoji)
echo "" && \
echo "=== ZAUSTAVLJANJE NGINX ===" && \
sudo systemctl stop nginx 2>/dev/null && echo "Nginx zaustavljen" || echo "Nginx nije pokrenut"

# 3. Zaustavi stare containere na portu 80
echo "" && \
echo "=== ZAUSTAVLJANJE STARIH CONTAINER-A ===" && \
docker ps -q --filter "publish=80" | xargs -r docker stop 2>/dev/null && echo "Stari container zaustavljen" || echo "Nema container-a na portu 80"

# 4. Zaustavi sve procese na portu 80 (agresivno)
echo "" && \
echo "=== ZAUSTAVLJANJE PROCESA NA PORTU 80 ===" && \
sudo fuser -k 80/tcp 2>/dev/null && echo "Procesi na portu 80 zaustavljeni" || echo "Nema procesa na portu 80"

# 5. Zaustavi sve Docker containere
echo "" && \
echo "=== ZAUSTAVLJANJE DOCKER CONTAINER-A ===" && \
docker compose -f docker-compose.production.yml down

# 6. Pokreni ponovo
echo "" && \
echo "=== POKRETANJE CONTAINER-A ===" && \
docker compose -f docker-compose.production.yml up -d

# 7. Proveri status
echo "" && \
echo "=== STATUS ===" && \
sleep 5 && \
docker compose -f docker-compose.production.yml ps
```

---

## ⚠️ VAŽNO

Ako koristiš Nginx kao reverse proxy na portu 80, **NE zaustavljaj ga!** Umesto toga:

1. Promeni port u docker-compose.production.yml na `8081:80` (ili neki drugi port)
2. Konfiguriši Nginx da proxy-uje sa portom 80 na `localhost:8081`

---

## 📝 Promena Porta (Ako Ne Možeš da Zaustaviš Proces)

Ako ne možeš da zaustaviš proces na portu 80, promeni port u docker-compose:

```bash
cd /opt/biozenapp
nano docker-compose.production.yml
```

Promeni:
```yaml
frontend:
  ports:
    - "80:80"  # Promeni u "8081:80" ili neki drugi port
```

Zatim:
```bash
git add docker-compose.production.yml
git commit -m "Change frontend port to 8081"
git push origin main
```

---

## 🐛 Troubleshooting

### Problem: "Port 80 i dalje zauzet"

```bash
# Proveri sve procese koji koriste port 80
sudo fuser 80/tcp

# Zaustavi sve procese na portu 80
sudo fuser -k 80/tcp

# Proveri da li je port sada slobodan
sudo lsof -i :80
```

### Problem: "Nginx se automatski restart-uje"

```bash
# Disable Nginx da se ne pokreće automatski
sudo systemctl disable nginx
sudo systemctl stop nginx
```

### Problem: "Stari container se ne zaustavlja"

```bash
# Force stop sve containere
docker stop $(docker ps -aq) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null

# Zatim pokreni ponovo
cd /opt/biozenapp
docker compose -f docker-compose.production.yml up -d
```
