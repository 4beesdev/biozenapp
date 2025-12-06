# ✅ Provera Nakon Deploy-a

## Šta da Tražiš u Logovima

### Backend Logovi - Trebalo bi da vidiš:

✅ **Dobro:**
```
Started MiniAppApplication in X seconds
Tomcat started on port(s): 8080
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

❌ **Loše:**
```
Connection refused
Could not connect to database
Port 8080 already in use
```

### Frontend Logovi - Trebalo bi da vidiš:

✅ **Dobro:**
```
nginx started
```

## Provera Statusa

### 1. Proveri da li su containeri pokrenuti

U **novom terminal prozoru** (ili pritisni `Ctrl+C` da zaustaviš logove):

```bash
cd /opt/biozenapp
docker compose ps
```

Trebalo bi da vidiš:
```
NAME                STATUS          PORTS
biozen-backend      Up (healthy)    0.0.0.0:8080->8080/tcp
biozen-frontend     Up              0.0.0.0:80->80/tcp
```

### 2. Testiraj Backend Direktno

```bash
# Health check
curl http://localhost:8080/actuator/health

# Trebalo bi da dobiješ: {"status":"UP"}
```

### 3. Testiraj Kroz Nginx

```bash
curl http://localhost/api/actuator/health
```

### 4. Testiraj u Browser-u

Otvori u browser-u:
```
http://164.90.231.47
```

Trebalo bi da vidiš:
- ✅ Login stranicu
- ✅ BioZen logo
- ✅ Formu za login/register

## Ako Vidiš Greške

### Problem: "Cannot connect to database"

```bash
# Proveri .env fajl
cat /opt/biozenapp/.env

# Proveri da li su database credentials ispravni
# Proveri da li je database dostupna
```

### Problem: "Port already in use"

```bash
# Proveri šta koristi port 8080
netstat -tlnp | grep 8080

# Ili
lsof -i :8080
```

### Problem: Backend ne startuje

```bash
# Proveri detaljne logove
docker compose logs backend | tail -100

# Restart backend
docker compose restart backend
```

## Ako Sve Radi ✅

1. **Otvori aplikaciju u browser-u**: `http://164.90.231.47`
2. **Testiraj registraciju**: Kreiraj novog korisnika
3. **Testiraj login**: Uloguj se
4. **Testiraj dashboard**: Proveri da li se učitava

## Sledeći Koraci

Ako sve radi:
- ✅ Aplikacija je deploy-ovana!
- Razmotri setup SSL sertifikata (Let's Encrypt)
- Razmotri setup monitoring-a

