# BioZen Brand Guide

## Boje brenda

Boje su definisane u `src/brand.css` fajlu. Možeš ih lako promeniti:

### Primarne boje (Zelena - priroda, zdravlje)
- `--brand-primary`: #10b981 (glavna zelena)
- `--brand-primary-dark`: #059669 (tamnija zelena)
- `--brand-primary-light`: #34d399 (svetlija zelena)

### Sekundarne boje (Plava - zen, mir)
- `--brand-secondary`: #3b82f6 (glavna plava)
- `--brand-secondary-dark`: #2563eb (tamnija plava)
- `--brand-secondary-light`: #60a5fa (svetlija plava)

### Akcent boje
- `--brand-accent`: #8b5cf6 (ljubičasta)
- `--brand-success`: #10b981 (zelena za uspeh)
- `--brand-error`: #ef4444 (crvena za greške)
- `--brand-warning`: #f59e0b (narandžasta za upozorenja)

## Logo

Logo se nalazi u `public/logo.svg`. 

### Kako da zameniš logo:

1. **Kreiraj svoj logo fajl** (SVG, PNG, ili JPG)
2. **Postavi ga u `public/` folder** sa imenom `logo.svg` (ili promeni putanju u `App.jsx`)
3. **Preporučene dimenzije**: 
   - Za login ekran: 60px visine
   - Za dashboard: 40px visine
   - SVG format je najbolji za skaliranje

### Ako logo ne postoji:

Aplikacija će automatski prikazati tekst "BioZen" sa gradient stilom umesto loga.

## Kako da promeniš boje

1. Otvori `frontend/src/brand.css`
2. Promeni vrednosti CSS varijabli
3. Osveži stranicu - promene će se automatski primeniti

### Primer: Promena primarne boje na crvenu

```css
:root {
  --brand-primary: #ef4444; /* umesto #10b981 */
  --brand-primary-dark: #dc2626;
  --brand-primary-light: #f87171;
}
```

## Gradijenti

Aplikacija koristi gradijente za dugmad i naslove:
- `--brand-gradient`: linear-gradient(135deg, #10b981 0%, #3b82f6 100%)

Možeš promeniti gradijent u `brand.css` fajlu.

