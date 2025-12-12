# 🔍 Provera Postojećih SSL Sertifikata

## Korak 1: Proveri da Li Postoje SSL Sertifikati

```bash
# SSH na production server
ssh root@164.90.231.47

# Proveri da li postoje SSL sertifikati
ls -la /opt/biozenapp/ssl/
ls -la /etc/ssl/
ls -la /etc/nginx/ssl/
ls -la /etc/letsencrypt/

# Proveri da li postoji Nginx konfiguracija sa SSL
grep -r "ssl_certificate" /etc/nginx/
grep -r "ssl_certificate" /opt/biozenapp/
```

---

## Korak 2: Proveri da Li Nginx Sluša na Portu 443

```bash
# Proveri da li nešto sluša na portu 443
sudo lsof -i :443
sudo netstat -tulpn | grep :443
sudo ss -tulpn | grep :443
```

---

## Korak 3: Proveri Postojeću Nginx Konfiguraciju

```bash
# Proveri da li postoji Nginx instaliran van Docker-a
which nginx
sudo systemctl status nginx

# Proveri Nginx konfiguraciju
cat /etc/nginx/sites-available/* 2>/dev/null
cat /etc/nginx/conf.d/* 2>/dev/null
```

---

## Korak 4: Proveri Docker Container Nginx Konfiguraciju

```bash
cd /opt/biozenapp

# Proveri trenutnu Nginx konfiguraciju u container-u
docker compose -f docker-compose.production.yml exec frontend cat /etc/nginx/conf.d/default.conf

# Proveri da li postoje SSL sertifikati u container-u
docker compose -f docker-compose.production.yml exec frontend ls -la /etc/nginx/ssl/
```

---

## Korak 5: Proveri Git Istoriju

```bash
cd /opt/biozenapp

# Proveri git log za SSL/HTTPS izmene
git log --all --grep="ssl\|https\|certificate" --oneline

# Proveri prethodnu verziju nginx.conf
git show HEAD~1:frontend/nginx.conf
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# 1. Proveri SSL sertifikate
echo "=== SSL SERTIFIKATI ===" && \
ls -la ssl/ 2>/dev/null || echo "Nema ssl/ direktorijuma" && \
ls -la /etc/ssl/ 2>/dev/null | head -10 || echo "Nema /etc/ssl/" && \
ls -la /etc/letsencrypt/ 2>/dev/null | head -10 || echo "Nema /etc/letsencrypt/"

# 2. Proveri port 443
echo "" && \
echo "=== PORT 443 CHECK ===" && \
sudo lsof -i :443 || sudo netstat -tulpn | grep :443 || echo "Port 443 je slobodan"

# 3. Proveri Nginx van Docker-a
echo "" && \
echo "=== NGINX VAN DOCKER-A ===" && \
which nginx && sudo systemctl status nginx | head -10 || echo "Nginx nije instaliran van Docker-a"

# 4. Proveri Docker container Nginx
echo "" && \
echo "=== DOCKER CONTAINER NGINX ===" && \
docker compose -f docker-compose.production.yml exec frontend cat /etc/nginx/conf.d/default.conf 2>/dev/null | head -20 || echo "Ne može da pristupi container-u"

# 5. Proveri git istoriju
echo "" && \
echo "=== GIT ISTORIJA ===" && \
git log --all --grep="ssl\|https\|certificate" --oneline | head -10 || echo "Nema SSL/HTTPS commit-ova"
```

---

## 🐛 Ako Postoje Sertifikati

Ako postoje sertifikati, možemo da ih koristimo:

1. **Ako su u `/etc/letsencrypt/`** (Let's Encrypt):
   - Mount-uj ih u Docker container
   - Ažuriraj docker-compose.production.yml

2. **Ako su u `/opt/biozenapp/ssl/`**:
   - Već su mount-ovani kroz docker-compose
   - Samo proveri da li su pravilno konfigurisani

3. **Ako su u `/etc/nginx/ssl/`** (van Docker-a):
   - Kopiraj ih u `/opt/biozenapp/ssl/`
   - ILI mount-uj direktno iz `/etc/nginx/ssl/`

---

## 📝 Napomene

- Ako su sertifikati već postojali, možda je problem bio u Nginx konfiguraciji
- Možda je Nginx bio konfigurisan van Docker-a, a sada koristimo Docker container
- Možda je port 443 bio zauzet od strane drugog procesa

