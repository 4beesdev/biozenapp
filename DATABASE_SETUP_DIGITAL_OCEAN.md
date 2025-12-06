# Database Setup na Digital Ocean - RUČNO

## Problem

Digital Ocean **NE expanduje** `${db.DATABASE_URL}` automatski. Vrednost ostaje kao placeholder `${dev-db-229452.DATABASE_URL}`.

## Rešenje: Ručno setovanje Environment Variables

### Korak 1: Pronađi Database Connection String

1. Idi na Digital Ocean Dashboard
2. Klikni na **Databases** u levom meniju
3. Klikni na tvoju bazu (npr. `dev-db-229452` ili `biozen-db`)
4. Idi na **Connection Details** tab
5. Kopiraj **Connection String** (format: `postgresql://user:pass@host:port/dbname`)

### Korak 2: Setuj Environment Variables u App Platform

1. Idi na Digital Ocean Dashboard → **Apps** → Tvoja aplikacija (`biozenapp`)
2. Klikni na **Settings**
3. Scroll do **App-Level Environment Variables**
4. Klikni **Edit** ili **Add Variable**

Dodaj sledeće varijable:

#### Varijabla 1: DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Zalepi connection string koji si kopirao (npr. `postgresql://biozen:password@host:port/biozenapp`)
- **Scope**: RUN_TIME
- **Type**: Secret (ako je opcija dostupna)

#### Varijabla 2: SPRING_DATASOURCE_URL (opciono)
- **Key**: `SPRING_DATASOURCE_URL`
- **Value**: Konvertuj DATABASE_URL u JDBC format:
  - Ako je `postgresql://user:pass@host:port/dbname`
  - JDBC format: `jdbc:postgresql://host:port/dbname`
- **Scope**: RUN_TIME

#### Varijabla 3: SPRING_DATASOURCE_USERNAME
- **Key**: `SPRING_DATASOURCE_USERNAME`
- **Value**: Username iz connection string-a (npr. `biozen`)
- **Scope**: RUN_TIME

#### Varijabla 4: SPRING_DATASOURCE_PASSWORD
- **Key**: `SPRING_DATASOURCE_PASSWORD`
- **Value**: Password iz connection string-a
- **Scope**: RUN_TIME
- **Type**: Secret (ako je opcija dostupna)

### Korak 3: Redeploy aplikaciju

1. Idi na **Deployments** tab
2. Klikni **Create Deployment** ili **Redeploy**

## Alternativno: Koristi samo DATABASE_URL

Ako setuješ samo `DATABASE_URL`, `DatabaseConfig.java` će automatski parsirati connection string i konvertovati ga u JDBC format.

## Provera

Nakon deployment-a, proveri Runtime Logs. Trebalo bi da vidiš:
- `✓ Parsed DATABASE_URL successfully:` ili
- `✓ Constructed JDBC URL from individual variables:`

## Troubleshooting

### Problem: "No valid database configuration found"

**Rešenje:**
- Proveri da li si setovao `DATABASE_URL` u App-Level Environment Variables
- Proveri da li je connection string validan
- Proveri da li nema razmaka na početku/kraju vrednosti

### Problem: "Connection refused"

**Rešenje:**
- Proveri da li je database komponenta **Running** u Digital Ocean
- Proveri da li su firewall settings dozvoljavaju konekciju
- Proveri da li je hostname/port tačan

### Problem: "Authentication failed"

**Rešenje:**
- Proveri username/password
- Proveri da li koristiš pravi database user (ne root)

