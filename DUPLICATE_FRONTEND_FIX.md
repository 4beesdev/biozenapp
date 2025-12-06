# Problem: Digital Ocean detektuje 2 frontend servisa

## Problem

Digital Ocean automatski detektuje:
1. ✅ Frontend servis iz `app.yaml` (Dockerfile)
2. ❌ Još jedan frontend servis jer vidi `package.json` i automatski detektuje Node.js buildpack

## Rešenje

### Opcija 1: Obriši duplikat u Digital Ocean interfejsu (NAJBRŽE)

1. Idi na Digital Ocean Dashboard → Tvoja aplikacija → Components
2. Pronađi duplikat frontend servisa
3. Obriši onaj koji je automatski detektovan (obično ima "Node.js" ili "Buildpack" kao build type)
4. Zadrži onaj koji koristi Dockerfile

### Opcija 2: Eksplicitno specifikuj Dockerfile

U Digital Ocean interfejsu:
1. Klikni na frontend servis koji želiš da zadržiš
2. Proveri da je:
   - **Build Type**: Docker
   - **Dockerfile Path**: `Dockerfile`
   - **Source Directory**: `frontend`
3. Obriši drugi frontend servis

### Opcija 3: Ručno konfiguriši sve

1. Obriši sve automatski detektovane servise
2. Ručno dodaj samo:
   - Backend servis (Docker, source_dir: `backend`)
   - Frontend servis (Docker, source_dir: `frontend`)
   - Database (PostgreSQL)

## Kako prepoznati koji frontend je pravi?

**Zadrži frontend servis koji:**
- ✅ Ima Build Type: **Docker**
- ✅ Ima Source Directory: **`frontend`**
- ✅ Ima Dockerfile Path: **`Dockerfile`**

**Obriši frontend servis koji:**
- ❌ Ima Build Type: **Buildpack** ili **Node.js**
- ❌ Nema eksplicitno definisan Dockerfile
- ❌ Je automatski detektovan

## Finalna konfiguracija

Trebalo bi da imaš:
- ✅ **1 Backend servis** (Docker, source_dir: `backend`)
- ✅ **1 Frontend servis** (Docker, source_dir: `frontend`)
- ✅ **1 Database** (PostgreSQL)

**UKUPNO: 3 komponente**

