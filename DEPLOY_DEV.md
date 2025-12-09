# Deploy Dev Verzije na Digital Ocean Droplet

## 1. Priprema na serveru

```bash
# Konektuj se na server
ssh root@164.90.231.47

# Kreiraj folder za dev verziju
cd /opt
mkdir biozenapp-dev
cd biozenapp-dev

# Kloniraj repo i prebaci se na dev granu
git clone https://github.com/4beesdev/biozenapp.git .
git checkout dev
```

## 2. Kreiraj .env fajl za dev

```bash
cd /opt/biozenapp-dev
nano .env
```

Dodaj sledeće (koristi iste vrednosti kao produkcija ili druge za dev):
```
POSTGRES_PASSWORD=change-this-password
JWT_SECRET=change-this-secret-key-change-this-please-32chars-min
```

## 3. Docker Compose za dev

Fajl `docker-compose.dev.yml` je već kreiran i push-ovan na dev granu. Ne treba ništa da menjaš - samo ga koristi.

Fajl je konfigurisan sa:
- Backend na portu 8082
- Frontend na portu 8083
- PostgreSQL na portu 5433
- Odvojeni network i volume za dev (ne meša se sa produkcijom)

## 4. Build i pokretanje dev verzije

```bash
cd /opt/biozenapp-dev

# Build i pokreni dev verziju
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d

# Proveri status
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f
```

**Napomena:** Ako dobiješ grešku da baza ne postoji, PostgreSQL kontejner automatski kreira bazu `biozenapp_dev` pri prvom pokretanju. Ako i dalje imaš problem, proveri logove:

```bash
# Proveri PostgreSQL logove
docker compose -f docker-compose.dev.yml logs postgres-dev

# Ako treba, konektuj se na PostgreSQL i kreiraj bazu ručno
docker compose -f docker-compose.dev.yml exec postgres-dev psql -U biozen -c "CREATE DATABASE biozenapp_dev;"
```

## 5. Konfiguriši Nginx za dev.biozen.rs

Kreiraj novi Nginx config fajl:

```bash
sudo nano /etc/nginx/sites-available/dev.biozen.rs
```

Dodaj sledeću konfiguraciju:

```nginx
# HTTP - redirect na HTTPS
server {
    listen 80;
    server_name dev.biozen.rs;
    return 301 https://$server_name$request_uri;
}

# HTTPS - proxy na dev frontend
server {
    listen 443 ssl http2;
    server_name dev.biozen.rs;

    # SSL sertifikati (koristi iste kao za app.biozen.rs ili kreiraj nove)
    ssl_certificate /etc/ssl/certs/dev.biozen.rs.pem;
    ssl_certificate_key /etc/ssl/private/dev.biozen.rs.key;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # SPA routing
    location / {
        proxy_pass http://localhost:8083;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API proxy - direktno na backend-dev
    location /api {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin $http_origin;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktiviraj config:

```bash
sudo ln -s /etc/nginx/sites-available/dev.biozen.rs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. DNS konfiguracija

Dodaj A record za `dev.biozen.rs` koji pokazuje na istu IP adresu kao `app.biozen.rs`:
- Type: A
- Name: dev
- Content: 164.90.231.47 (ili tvoja IP adresa)
- Proxy: ON (ako koristiš Cloudflare)

## 7. SSL sertifikati za dev.biozen.rs

Ako koristiš Cloudflare Origin Certificates:
1. Kreiraj novi origin certificate za `dev.biozen.rs` na Cloudflare
2. Upload sertifikate na server:
   ```bash
   sudo nano /etc/ssl/certs/dev.biozen.rs.pem
   sudo nano /etc/ssl/private/dev.biozen.rs.key
   ```
3. Postavi prava pristupa:
   ```bash
   sudo chmod 644 /etc/ssl/certs/dev.biozen.rs.pem
   sudo chmod 600 /etc/ssl/private/dev.biozen.rs.key
   ```

## 8. Provera

```bash
# Proveri da li dev verzija radi
curl http://localhost:8082/actuator/health
curl http://localhost:8083

# Proveri Nginx
sudo systemctl status nginx
```

## 9. Workflow za development

1. **Radi na dev grani lokalno:**
   ```bash
   git checkout dev
   # Napravi izmene
   git add .
   git commit -m "Opis izmena"
   git push origin dev
   ```

2. **Na serveru, povuci najnovije izmene:**
   ```bash
   cd /opt/biozenapp-dev
   git pull origin dev
   docker compose -f docker-compose.dev.yml build
   docker compose -f docker-compose.dev.yml up -d
   ```

3. **Kada su izmene spremne za produkciju:**
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```

## 10. Troubleshooting

- **Portovi zauzeti:** Proveri sa `netstat -tulpn | grep -E "8082|8083|5433"`
- **Nginx greške:** `sudo nginx -t` i `sudo tail -f /var/log/nginx/error.log`
- **Docker greške:** `docker compose -f docker-compose.dev.yml logs -f`
- **Baza ne radi:** Proveri da li je `biozenapp_dev` kreirana u PostgreSQL

