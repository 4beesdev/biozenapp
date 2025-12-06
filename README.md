# BioZen App

Aplikacija za praćenje kilaže i zdravstvenih podataka.

## Tehnologije

- **Backend**: Spring Boot 3.3.5 (Java 17)
- **Frontend**: React 19 + Vite
- **Database**: PostgreSQL 15
- **Containerization**: Docker + Docker Compose

## Lokalno pokretanje

### Prerequisites
- Java 17+
- Node.js 20+
- PostgreSQL 15+
- Docker i Docker Compose (opciono)

### Sa Docker Compose (Preporučeno)

```bash
# Kloniraj repozitorijum
git clone https://github.com/4beesdev/biozenapp.git
cd biozenapp

# Kreiraj .env fajl
cp .env.example .env
# Uredi .env i dodaj svoje vrednosti

# Pokreni aplikaciju
docker compose up -d

# Aplikacija će biti dostupna na:
# Frontend: http://localhost
# Backend: http://localhost:8080
```

### Bez Docker-a

#### Backend
```bash
cd backend
mvn spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deployment

Pogledaj [DEPLOYMENT.md](./DEPLOYMENT.md) za detaljne instrukcije za deployment na Digital Ocean.

## Funkcionalnosti

- ✅ Registracija i login korisnika
- ✅ Unos i ažuriranje korisničkih podataka (ime, prezime, pol, starost, kilaža)
- ✅ Praćenje merenja kilaže kroz vreme
- ✅ Grafički prikaz trenda kilaže
- ✅ Eksport grafikona kao sliku
- ✅ Responsive dizajn za mobilne uređaje

## Struktura projekta

```
biozenapp/
├── backend/          # Spring Boot aplikacija
├── frontend/         # React aplikacija
├── docker-compose.yml # Docker orchestriranje
└── .do/              # Digital Ocean konfiguracija
```

## License

MIT

