# Kako da setuješ APP_JWT_SECRET u Digital Ocean

## Korak 1: Generiši Secret (već si uradio ✅)

```bash
openssl rand -base64 32
```

Kopiraj rezultat (npr: `aBc123XyZ456...`)

## Korak 2: Setuj u Digital Ocean

### Opcija A: App-Level Environment Variables (PREPORUČENO)

1. **Idi na Digital Ocean Dashboard**
   - https://cloud.digitalocean.com

2. **Otvori svoju aplikaciju**
   - Klikni na "Apps" u levom meniju
   - Klikni na aplikaciju "biozenapp" (ili kako si je nazvao)

3. **Idi na Settings**
   - U gornjem meniju klikni na "Settings"

4. **Dodaj Environment Variable**
   - Scroll do sekcije "App-Level Environment Variables"
   - Klikni na "Edit" ili "Add Variable"
   - **Key**: `APP_JWT_SECRET`
   - **Value**: Zalepi vrednost koju si generisao (npr: `aBc123XyZ456...`)
   - **Scope**: RUN_TIME
   - **Type**: Secret (ako je opcija dostupna - ovo će sakriti vrednost u interfejsu)
   - Klikni "Save" ili "Add"

5. **Redeploy aplikaciju**
   - Idi na "Deployments" tab
   - Klikni "Create Deployment" ili "Redeploy"

### Opcija B: Kroz app.yaml (manje preporučeno)

Ako želiš da dodaš direktno u `app.yaml`, možeš, ali **NIKAD ne commit-uj secret u Git!**

```yaml
envs:
  - key: APP_JWT_SECRET
    scope: RUN_TIME
    type: SECRET
    value: "tvoj-generisani-secret-ovde"  # ⚠️ NIKAD ne commit-uj ovo!
```

**⚠️ VAŽNO**: Ako dodaš u `app.yaml`, **NE commit-uj taj fajl** sa secret-om! Koristi `.env` ili App-Level variables.

## Korak 3: Proveri da li radi

1. Idi na "Runtime Logs" u Digital Ocean
2. Proveri da li se aplikacija pokrenula bez greške
3. Ako vidiš grešku "JWT secret key must be at least 32 characters", proveri da li si dobro kopirao secret

## Troubleshooting

### Problem: "JWT secret key must be at least 32 characters"

**Rešenje:**
- Proveri da li si kopirao ceo secret (trebalo bi da bude ~44 karaktera za base64)
- Proveri da nema razmaka na početku/kraju
- Generiši novi secret ako treba

### Problem: Secret se ne čuva

**Rešenje:**
- Proveri da li si kliknuo "Save" ili "Add"
- Proveri da li je Scope setovan na RUN_TIME
- Proveri da li je Key tačno: `APP_JWT_SECRET` (case-sensitive!)

### Problem: Ne znam gde je "App-Level Environment Variables"

**Rešenje:**
- Idi na: Dashboard → Apps → Tvoja aplikacija → Settings
- Scroll do sekcije "Environment Variables"
- Može biti pod "App-Level" ili samo "Environment Variables"

## Screenshot putanja (ako ti treba):

1. Apps → [Tvoja aplikacija]
2. Settings (gornji meni)
3. Scroll do "App-Level Environment Variables"
4. Klikni "Edit" ili "Add Variable"
5. Dodaj Key: `APP_JWT_SECRET`, Value: [tvoj secret]

