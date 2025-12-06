# Deployment Errors - Troubleshooting

## Problem: "Container exited with a non-zero exit code"

### Mogući uzroci:

1. **Database connection problem**
   - Backend ne može da se poveže sa PostgreSQL bazom
   - Proveri environment variables za bazu

2. **JWT Secret nije setovan**
   - `APP_JWT_SECRET` mora biti setovan
   - Minimum 32 karaktera

3. **Port konfiguracija**
   - Backend mora da sluša na portu 8080
   - Proveri da li je `http_port: 8080` u app.yaml

4. **Database URL format**
   - Digital Ocean daje `DATABASE_URL` u formatu: `postgresql://user:pass@host:port/dbname`
   - Spring Boot očekuje: `jdbc:postgresql://host:port/dbname`
   - Kreirao sam `DatabaseUrlParser` koji automatski konvertuje format

## Rešenja:

### 1. Proveri Environment Variables u Digital Ocean

Idi na: Dashboard → Tvoja aplikacija → Settings → App-Level Environment Variables

**OBAVEZNO setovati:**
- `APP_JWT_SECRET` - generiši sa: `openssl rand -base64 32`
- `DATABASE_URL` - automatski se setuje od strane Digital Ocean baze

### 2. Proveri Database Connection

U Digital Ocean interfejsu:
1. Idi na Database komponentu
2. Proveri da li je status: **Running**
3. Proveri connection string

### 3. Proveri Logove

1. Idi na: Dashboard → Tvoja aplikacija → Runtime Logs
2. Pogledaj greške u logovima
3. Traži:
   - `Connection refused` - baza nije dostupna
   - `Authentication failed` - loša lozinka
   - `JWT secret too short` - JWT secret nije dobar

### 4. Proveri Health Check

Backend ima health check endpoint:
- `http://your-app-url/actuator/health`

Ako health check ne radi, aplikacija će se gasiti.

### 5. Ručno testiranje Database URL-a

Ako `DATABASE_URL` nije u pravom formatu, možeš ručno setovati:

```yaml
envs:
  - key: SPRING_DATASOURCE_URL
    value: jdbc:postgresql://${db.HOSTNAME}:${db.PORT}/${db.DATABASE}
  - key: SPRING_DATASOURCE_USERNAME
    value: ${db.USERNAME}
  - key: SPRING_DATASOURCE_PASSWORD
    value: ${db.PASSWORD}
```

## Česti problemi:

### Problem: "Failed to obtain JDBC Connection"

**Rešenje:**
- Proveri da li je baza kreirana i running
- Proveri connection string
- Proveri username/password

### Problem: "JWT secret key must be at least 32 characters"

**Rešenje:**
- Generiši novi secret: `openssl rand -base64 32`
- Setuj `APP_JWT_SECRET` environment variable

### Problem: "Application failed to start"

**Rešenje:**
- Proveri logove za specifičnu grešku
- Proveri da li su svi environment variables setovani
- Proveri da li je port 8080 dostupan

## Debug koraci:

1. **Proveri da li se aplikacija build-uje:**
   - Idi na Build Logs
   - Proveri da li je build uspešan

2. **Proveri da li se aplikacija pokreće:**
   - Idi na Runtime Logs
   - Proveri prve linije - tu su greške

3. **Proveri environment variables:**
   - Idi na Settings → Environment Variables
   - Proveri da li su sve setovane

4. **Testiraj lokalno sa Docker:**
   ```bash
   docker compose up
   ```
   - Ako radi lokalno, problem je u Digital Ocean konfiguraciji

