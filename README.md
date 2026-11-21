# مسار · Next.js app

Next.js (App Router) port of the static MVP in `../src`. Same pages, same synthetic data (identical seed and generation order, so every number matches the static build), real routes instead of hash routing.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/ (deploy out/ to any static host)
npm test           # smoke test: all routes, inspector flow, filters, KPI parity with ../dist (needs ../build.sh run first)
node tests/responsive.mjs   # 390px / 820px screenshots + overflow check
```

Tests use `playwright-core` with the system Chrome (`/usr/bin/google-chrome`). Screenshots go to `tests/out/`.

## Layout
- `lib/data.js`: data engine, ported from `src/p2.js` (+ crossings, points ledger and PCI from p3/p4). Don't reorder: PCI consumes the RNG right after inspections.
- `lib/geo.js`: npo.gov.sd state boundaries and projection. `lib/pages.js`: nav/routes. `lib/rewards.js`: catalogue.
- `components/Shell.jsx`: sidebar, top bar, global filters (context, survives navigation), toast, map tooltip. Pages render client-side only, because generation uses local-time `Date` methods (same as the static build).
- `components/Chart.jsx`: Chart.js wrapper (`LineChart`, `BarChart`), same options as the static `lineChart`/`barChart`.
- `components/SudanMap.jsx`: SVG map. Keeps the map conventions in `../CLAUDE.md`.
- `components/pages/*`: one component per page. `app/*/page.jsx`: thin route wrappers.

Old links like `index.html#fuel` redirect to `/fuel/`.
