# Kako da pronađeš Database Connection String na Digital Ocean

## Šta je "dev baza"?

"Dev baza" je **development database** - baza podataka koja se koristi za development/testiranje. Na Digital Ocean, ovo je obično privremena baza koja se koristi za testiranje aplikacije.

## Kako da pronađeš Connection String:

### Korak 1: Otvori Digital Ocean Dashboard

1. Idi na: https://cloud.digitalocean.com
2. Uloguj se

### Korak 2: Pronađi svoju bazu

1. Klikni na **Databases** u levom meniju
2. Trebalo bi da vidiš listu baza - traži onu koja se zove:
   - `dev-db-229452` (ako je automatski kreirana)
   - `biozen-db` (ako si je ručno kreirao)
   - Ili bilo koja druga baza koja pripada tvojoj aplikaciji

### Korak 3: Otvori Connection Details

1. Klikni na bazu
2. Idi na **Connection Details** tab
3. Tu ćeš videti:
   - **Host**
   - **Port**
   - **Database**
   - **Username**
   - **Password**
   - **SSL Mode**

### Korak 4: Kopiraj Connection String

Digital Ocean obično ima **"Connection String"** sekciju gde možeš direktno kopirati connection string.

**ILI** konstruiši ga ručno:

Format:
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

Primer:
```
postgresql://username:password@host:port/database?sslmode=require
```

## Ako ne vidiš bazu:

### Opcija 1: Baza je kreirana kroz App Platform

1. Idi na: **Apps** → Tvoja aplikacija → **Components**
2. Traži **Database** komponentu
3. Klikni na nju - trebalo bi da te vodi do baze

### Opcija 2: Baza nije kreirana

Ako nema baze, možeš je kreirati:

1. Idi na: **Apps** → Tvoja aplikacija → **Components**
2. Klikni **Add Component** → **Database**
3. Izaberi:
   - **Engine**: PostgreSQL
   - **Version**: 15
   - **Plan**: Basic (najjeftiniji)
4. Klikni **Create Database**

## Provera:

Nakon što pronađeš connection string, setuj ga kao `DATABASE_URL` environment variable u App Platform (kako sam objasnio ranije).

## Razlika između dev i production baze:

- **Dev baza**: Za testiranje, jeftinija, može se brisati
- **Production baza**: Za pravu aplikaciju, skuplja, sa backup-om

Za sada koristi dev bazu - to je sasvim dovoljno za testiranje!

