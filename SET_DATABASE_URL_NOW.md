# ⚠️ HITNO: Setuj DATABASE_URL Environment Variable

GitHub ne dozvoljava da push-ujem password u kod (sigurnosni razlog). 

**MORAŠ ručno da setuješ environment variable u Digital Ocean interfejsu.**

## Connection String format:

```
postgresql://username:password@host:port/database?sslmode=require
```

(Koristi tvoje stvarne database credentials iz Digital Ocean Dashboard)

## Koraci (5 minuta):

### 1. Otvori Digital Ocean Dashboard
- https://cloud.digitalocean.com
- Apps → Tvoja aplikacija (`biozenapp`)

### 2. Settings → Environment Variables
- Klikni **Settings** (gornji meni)
- Scroll do **App-Level Environment Variables**
- Klikni **Edit** ili **Add Variable**

### 3. Dodaj DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Zalepi connection string iznad
- **Scope**: RUN_TIME
- **Type**: Secret (ako je opcija dostupna)
- **Save**

### 4. Redeploy
- **Deployments** tab → **Create Deployment**

## Provera:

Nakon redeploy-a, Runtime Logs treba da pokaže:
- `✓ Parsed DATABASE_URL successfully:`

## Zašto ovo?

GitHub automatski blokira push-ove sa password-ima u kodu (secret scanning). Ovo je dobra sigurnosna praksa - password-i ne treba da budu u git repozitorijumu.

