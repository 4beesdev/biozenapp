# ✅ Korišćenje Postojećih SSL Sertifikata

## Pronađeno

- ✅ SSL sertifikati postoje u `/etc/ssl/certs/` i `/etc/ssl/private/`
- ✅ Nginx konfiguracija postoji u `/etc/nginx/sites-available/`
- ✅ Postoje sertifikati za `dev.biozen.rs` i `app.biozen.rs`

---

## Korak 1: Proveri Nginx Konfiguraciju van Docker-a

```bash
# SSH na production server
ssh root@164.90.231.47

# Proveri Nginx konfiguraciju za app.biozen.rs
cat /etc/nginx/sites-available/app.biozen.rs

# Proveri da li je symlink-ovan u sites-enabled
ls -la /etc/nginx/sites-enabled/

# Proveri da li Nginx radi
sudo systemctl status nginx
```

---

## Korak 2: Proveri SSL Sertifikate

```bash
# Proveri da li sertifikati postoje
ls -la /etc/ssl/certs/app.biozen.rs.pem
ls -la /etc/ssl/private/app.biozen.rs.key

# Proveri sertifikat
openssl x509 -in /etc/ssl/certs/app.biozen.rs.pem -text -noout | head -20
```

---

## Korak 3: Ažuriraj docker-compose.production.yml

Ažuriraj da koristi postojeće sertifikate:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: biozen-frontend
  environment:
    REACT_APP_API_URL: ${REACT_APP_API_URL:-http://localhost:8080}
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /etc/ssl/certs/app.biozen.rs.pem:/etc/nginx/ssl/origin.crt:ro
    - /etc/ssl/private/app.biozen.rs.key:/etc/nginx/ssl/origin.key:ro
  depends_on:
    - backend
  restart: unless-stopped
  networks:
    - biozen-network
```

---

## Korak 4: Proveri da Li Nginx van Docker-a Konfliktuje

```bash
# Proveri da li Nginx van Docker-a sluša na portu 80/443
sudo lsof -i :80
sudo lsof -i :443

# Ako sluša, zaustavi ga (ako koristiš Docker Nginx)
sudo systemctl stop nginx
sudo systemctl disable nginx
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# 1. Proveri Nginx konfiguraciju
echo "=== NGINX KONFIGURACIJA ===" && \
cat /etc/nginx/sites-available/app.biozen.rs

# 2. Proveri SSL sertifikate
echo "" && \
echo "=== SSL SERTIFIKATI ===" && \
ls -la /etc/ssl/certs/app.biozen.rs.pem && \
ls -la /etc/ssl/private/app.biozen.rs.key

# 3. Proveri Nginx status
echo "" && \
echo "=== NGINX STATUS ===" && \
sudo systemctl status nginx | head -10

# 4. Proveri portove
echo "" && \
echo "=== PORT 80/443 CHECK ===" && \
sudo lsof -i :80 && \
sudo lsof -i :443
```

---

## Rešenje: Koristi Postojeće Sertifikate u Docker-u

Ažuriraj `docker-compose.production.yml` da mount-uje postojeće sertifikate:

```yaml
volumes:
  - /etc/ssl/certs/app.biozen.rs.pem:/etc/nginx/ssl/origin.crt:ro
  - /etc/ssl/private/app.biozen.rs.key:/etc/nginx/ssl/origin.key:ro
```

Zatim rebuild i restart.

