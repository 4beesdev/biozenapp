# 🔧 Rešavanje 502 Bad Gateway i CORS Problema

## Problem 1: 502 Bad Gateway

Ovo znači da Nginx ne može da se poveže sa backend-om. Proveri:

### 1. Proveri da li backend container radi

```bash
cd /opt/biozenapp
docker compose ps
```

Trebalo bi da vidiš:
```
NAME                STATUS
biozen-backend      Up
biozen-frontend     Up
```

### 2. Proveri backend logove

```bash
docker compose logs backend
```

Ako vidiš greške:
- Database connection error → Proveri `.env` fajl
- Port already in use → Proveri da li nešto već koristi port 8080

### 3. Proveri da li backend sluša na portu 8080

```bash
# Unutar backend containera
docker compose exec backend netstat -tlnp | grep 8080

# Ili sa hosta
curl http://localhost:8080/actuator/health
```

### 4. Popravi Nginx konfiguraciju

```bash
# Otvori Nginx konfiguraciju
nano /etc/nginx/sites-available/biozenapp
```

Zameni sa:

```nginx
server {
    listen 80;
    server_name _;

    # Frontend - direktno sa Docker containera
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API - direktno na backend container
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

### 5. Reload Nginx

```bash
nginx -t
systemctl reload nginx
```

## Problem 2: CORS

CORS se rešava na dva mesta:

### 1. Backend CORS konfiguracija

Backend već ima CORS konfiguraciju, ali treba da dozvoli sve origin-e za production:

```bash
# Proveri backend CORS konfiguraciju
docker compose exec backend cat /app/src/main/java/com/example/app/config/CorsConfig.java
```

### 2. Nginx CORS headers (gore u konfiguraciji)

## Brzo Rešenje - Sve odjednom

```bash
cd /opt/biozenapp

# 1. Proveri status
docker compose ps
docker compose logs backend | tail -50

# 2. Restart backend ako ne radi
docker compose restart backend

# 3. Popravi Nginx
cat > /etc/nginx/sites-available/biozenapp << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
NGINX_EOF

# 4. Reload Nginx
nginx -t && systemctl reload nginx

# 5. Testiraj
curl -X OPTIONS http://localhost/api/auth/login -v
```

## Provera

```bash
# Testiraj backend direktno
curl http://localhost:8080/actuator/health

# Testiraj kroz Nginx
curl http://localhost/api/actuator/health

# Testiraj sa browser-a
# Otvori: http://164.90.231.47
```

