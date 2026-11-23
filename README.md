# OkvirPro

Softver za proizvođače PVC i ALU stolarije: ponude, krojne liste, radni nalozi, magacin, avansi, računi i finansije.

Specifikacija i redosled rada: [docs/SPECIFIKACIJA.md](docs/SPECIFIKACIJA.md)

## Pokretanje

```powershell
npm install
npm run db:push    # pravi lokalnu SQLite bazu (prisma/dev.db)
npm run db:seed    # početni podaci: profili, okov, staklo, modeli, paneli
npm run dev        # http://localhost:3000
```

`npm run db:studio` otvara pregled baze u pretraživaču.

## Tehnologije
Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Prisma + SQLite (kasnije Supabase/PostgreSQL)
