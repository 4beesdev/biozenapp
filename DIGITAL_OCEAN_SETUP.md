# Digital Ocean App Platform - Setup Vodič

## Problem: "No components detected"

Ako vidiš ovu grešku, evo šta treba da proveriš:

### 1. Proveri da li je `app.yaml` fajl prisutan

Digital Ocean traži `app.yaml` fajl u:
- Root direktorijumu repozitorijuma (`/app.yaml`)
- ILI u `.do/` direktorijumu (`/.do/app.yaml`)

**Rešenje**: Kreirao sam oba fajla - `app.yaml` u root-u i `.do/app.yaml`. Oba su identična.

### 2. Proveri GitHub integraciju

1. Idi na Digital Ocean Dashboard → Settings → App Platform → GitHub
2. Proveri da li je repozitorijum `4beesdev/biozenapp` povezan
3. Proveri da li Digital Ocean ima dozvole za čitanje repozitorijuma

### 3. Ručno kreiranje aplikacije

Ako automatska detekcija ne radi, možeš ručno kreirati aplikaciju:

1. **Kreiraj App na Digital Ocean:**
   - Idi na Dashboard → Apps → Create App
   - Izaberi "GitHub" kao izvor
   - Poveži repozitorijum: `4beesdev/biozenapp`
   - Izaberi branch: `main`

2. **Konfiguriši Backend servis:**
   - Klikni "Edit" na komponenti
   - **Source Directory**: `backend`
   - **Build Type**: Docker
   - **Dockerfile Path**: `Dockerfile`
   - **HTTP Port**: `8080`
   - **Routes**: `/api`

3. **Konfiguriši Frontend servis:**
   - Klikni "Add Component" → "Service"
   - **Source Directory**: `frontend`
   - **Build Type**: Docker
   - **Dockerfile Path**: `Dockerfile`
   - **HTTP Port**: `80`
   - **Routes**: `/`

4. **Dodaj Database:**
   - Klikni "Add Component" → "Database"
   - **Engine**: PostgreSQL
   - **Version**: 15
   - **Name**: `db`

5. **Environment Variables:**
   - Backend:
     - `SPRING_DATASOURCE_URL` = `${db.DATABASE_URL}`
     - `SPRING_DATASOURCE_USERNAME` = `${db.USERNAME}`
     - `SPRING_DATASOURCE_PASSWORD` = `${db.PASSWORD}`
     - `APP_JWT_SECRET` = (generiši secret: `openssl rand -base64 32`)
     - `APP_JWT_TTLMILLIS` = `604800000`
   - Frontend:
     - `REACT_APP_API_URL` = `${backend.PUBLIC_URL}`

### 4. Alternativni pristup - Buildpack umesto Dockerfile

Ako Dockerfile pristup ne radi, možeš koristiti buildpack:

**Backend (Java/Spring Boot):**
- **Build Type**: Buildpack
- **Buildpack**: `heroku/buildpacks:20` ili `paketo-buildpacks/java`

**Frontend (Node.js/React):**
- **Build Type**: Buildpack
- **Buildpack**: `heroku/buildpacks:20` ili `paketo-buildpacks/nodejs`

### 5. Provera da li Dockerfile-ovi postoje

Proveri da li su Dockerfile-ovi prisutni u repozitorijumu:
- `backend/Dockerfile` ✓
- `frontend/Dockerfile` ✓

### 6. Provera YAML sintakse

Proveri da li je `app.yaml` validan YAML:
- Koristi razmake, ne tabove
- Proveri uvlačenja (indentation)
- Proveri da li su svi stringovi u navodnicima gde je potrebno

### 7. Kontaktiranje podrške

Ako ništa od navedenog ne pomaže:
1. Idi na Digital Ocean Support
2. Podeli link ka repozitorijumu
3. Podeli screenshot greške
4. Podeli sadržaj `app.yaml` fajla

## Trenutna konfiguracija

Aplikacija je konfigurisana sa:
- ✅ `app.yaml` u root-u
- ✅ `.do/app.yaml` u `.do/` direktorijumu
- ✅ `source_dir` za svaki servis
- ✅ `dockerfile_path` za svaki servis
- ✅ Environment variables konfigurisane
- ✅ Database konfigurisana

## Sledeći koraci

1. Push-uj sve promene na GitHub (već urađeno ✓)
2. Pokušaj ponovo da kreiraš aplikaciju na Digital Ocean
3. Ako i dalje ne radi, koristi ručno kreiranje (korak 3 iznad)

