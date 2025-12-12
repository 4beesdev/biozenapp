# 🔒 Setup HTTPS za Production (Cloudflare Full Strict)

## Problem

Cloudflare "Full (strict)" zahteva da origin server ima validan SSL sertifikat i da sluša na portu 443 (HTTPS).

Trenutno, Nginx sluša samo na portu 80 (HTTP).

---

## Rešenje: Dodaj HTTPS Konfiguraciju

### Korak 1: Kreiraj Cloudflare Origin Certificate

1. Idi na Cloudflare Dashboard: https://dash.cloudflare.com
2. Izaberi domen `biozen.rs`
3. Idi na **SSL/TLS** → **Origin Server**
4. Klikni **Create Certificate**
5. Izaberi:
   - **Private key type**: RSA (2048)
   - **Hostnames**: `app.biozen.rs` (i `dev.biozen.rs` ako želiš)
   - **Certificate Validity**: 15 years
6. Klikni **Create**
7. Kopiraj:
   - **Origin Certificate** (`.crt` fajl)
   - **Private Key** (`.key` fajl)

---

### Korak 2: Sačuvaj Sertifikate na Serveru

```bash
# SSH na production server
ssh root@164.90.231.47

# Kreiraj direktorijum za sertifikate
mkdir -p /opt/biozenapp/ssl

# Kreiraj origin.crt fajl
nano /opt/biozenapp/ssl/origin.crt
# Zalepi Origin Certificate (ceo tekst, uključujući -----BEGIN CERTIFICATE----- i -----END CERTIFICATE-----)

# Kreiraj origin.key fajl
nano /opt/biozenapp/ssl/origin.key
# Zalepi Private Key (ceo tekst, uključujući -----BEGIN PRIVATE KEY----- i -----END PRIVATE KEY-----)

# Postavi prava pristupa (važno za sigurnost!)
chmod 600 /opt/biozenapp/ssl/origin.key
chmod 644 /opt/biozenapp/ssl/origin.crt
```

---

### Korak 3: Ažuriraj Nginx Konfiguraciju

Kreiraj novu Nginx konfiguraciju sa HTTPS podrškom:

```bash
cd /opt/biozenapp
nano frontend/nginx.conf
```

Zameni sadržaj sa:

```nginx
# HTTP server - redirect na HTTPS
server {
    listen 80;
    server_name app.biozen.rs dev.biozen.rs _;
    
    # Redirect sve na HTTPS
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name app.biozen.rs dev.biozen.rs _;
    
    root /usr/share/nginx/html;
    index index.html;

    # SSL sertifikati
    ssl_certificate /etc/nginx/ssl/origin.crt;
    ssl_certificate_key /etc/nginx/ssl/origin.key;
    
    # SSL konfiguracija
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # SPA routing - sve rute idu na index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy - prosleđuje zahteve na backend
    location /api {
        proxy_pass http://backend:8080;
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

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### Korak 4: Ažuriraj Dockerfile

Ažuriraj `frontend/Dockerfile` da kopira SSL sertifikate:

```dockerfile
# Frontend Dockerfile - React/Vite
FROM node:20-alpine AS build
WORKDIR /app

# Kopiraj package fajlove
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Kopiraj source kod i build
COPY . .
RUN npm run build

# Production image sa nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Kopiraj build fajlove
COPY --from=build /app/dist .

# Kopiraj nginx konfiguraciju
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiraj SSL sertifikate (ako postoje)
COPY ssl/ /etc/nginx/ssl/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

---

### Korak 5: Ažuriraj docker-compose.production.yml

Dodaj port 443 i mount SSL sertifikata:

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
    - ./ssl:/etc/nginx/ssl:ro  # Mount SSL sertifikata
  depends_on:
    - backend
  restart: unless-stopped
  networks:
    - biozen-network
```

---

### Korak 6: Rebuild i Restart

```bash
cd /opt/biozenapp

# Rebuild frontend
docker compose -f docker-compose.production.yml build --no-cache frontend

# Restart
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d

# Proveri status
docker compose -f docker-compose.production.yml ps

# Proveri logove
docker compose -f docker-compose.production.yml logs frontend | tail -30
```

---

### Korak 7: Test HTTPS

```bash
# Test HTTPS lokalno
curl -k https://localhost:443

# Test sa IP adresom
curl -k https://164.90.231.47
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# 1. Kreiraj SSL direktorijum
mkdir -p ssl

# 2. Kreiraj origin.crt (ZAMENI sa tvojim sertifikatom)
cat > ssl/origin.crt << 'EOF'
-----BEGIN CERTIFICATE-----
[ZALEPI ORIGIN CERTIFICATE OVDE]
-----END CERTIFICATE-----
EOF

# 3. Kreiraj origin.key (ZAMENI sa tvojim private key-jem)
cat > ssl/origin.key << 'EOF'
-----BEGIN PRIVATE KEY-----
[ZALEPI PRIVATE KEY OVDE]
-----END PRIVATE KEY-----
EOF

# 4. Postavi prava pristupa
chmod 600 ssl/origin.key
chmod 644 ssl/origin.crt

# 5. Pull najnovije izmene (sa HTTPS konfiguracijom)
git pull origin main

# 6. Rebuild frontend
docker compose -f docker-compose.production.yml build --no-cache frontend

# 7. Restart
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d

# 8. Proveri status
docker compose -f docker-compose.production.yml ps

# 9. Test HTTPS
curl -k https://localhost:443 | head -10
```

---

## ⚠️ VAŽNO

1. **SSL sertifikati su osetljivi podaci** - ne commit-uj ih u git!
2. **Dodaj `ssl/` u `.gitignore`**:
   ```bash
   echo "ssl/" >> .gitignore
   ```
3. **Backup sertifikata** - sačuvaj ih na sigurnom mestu

---

## 🐛 Troubleshooting

### Problem: "SSL certificate not found"

```bash
# Proveri da li sertifikati postoje
ls -la /opt/biozenapp/ssl/

# Proveri da li su pravilno mount-ovani u container
docker compose -f docker-compose.production.yml exec frontend ls -la /etc/nginx/ssl/
```

### Problem: "SSL handshake failed"

1. Proveri da li je Cloudflare Origin Certificate pravilno instaliran
2. Proveri da li je Private Key tačan
3. Proveri da li su prava pristupa pravilna (`chmod 600` za key, `chmod 644` za cert)

---

## ✅ Checklist

- [ ] Cloudflare Origin Certificate kreiran
- [ ] SSL sertifikati sačuvani na serveru (`/opt/biozenapp/ssl/`)
- [ ] Nginx konfiguracija ažurirana (HTTPS na portu 443)
- [ ] Dockerfile ažuriran (kopira SSL sertifikate)
- [ ] docker-compose.production.yml ažuriran (port 443 i volume mount)
- [ ] Frontend rebuild-ovan i restart-ovan
- [ ] HTTPS test prošao (`curl -k https://localhost:443`)

---

## 🎉 Gotovo!

Nakon što sve uradiš, Cloudflare "Full (strict)" bi trebalo da radi! 🚀

