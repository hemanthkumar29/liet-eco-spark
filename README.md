# LIET Eco-Spark Store

Student-built storefront for LIET-made lighting products. Frontend is React + Vite; backend is a lightweight Express API that persists data to local JSON/CSV files (no external services required).

## Quick start

```sh
npm install
npm run server   # starts API on http://localhost:5000
npm run dev      # starts Vite on http://localhost:8080 with /api proxy
```

## Environment

- Copy `.env.example` to `.env.local` (or `.env`) and adjust:
	- `VITE_API_BASE_URL` (leave empty for same-origin in dev)
	- `VITE_ADMIN_PASSCODE` (used for the admin gate)

## Data model (file-backed)

- Products: `data/products.json` — edit to change the catalog. Each item uses `quantity_available` for stock.
- Orders: `data/orders.json` — every checkout writes a record here.
- CSV: `data/orders.csv` — regenerated on each order create/update for spreadsheet use.
- Extra exports: run `node scripts/export-orders.mjs` to drop timestamped CSVs into `/exports`.

## Frontend features

- Product grid, detail pages, cart (Zustand), and checkout form with validation.
- Admin access via `/admin` using the passcode → redirects to `/._admin_hidden_link_8462` for order list, filtering, status/notes updates, and CSV export.
- Tailwind + shadcn components for UI.

## API (Express)

- `GET /api/products` — list catalog.
- `GET /api/products/:id` — single product.
- `POST /api/orders` — create order; validates required fields and stock, decrements inventory, rewrites CSV.
- `GET /api/orders` — list orders (newest first).
- `GET /api/orders/:orderId` — fetch one.
- `PATCH /api/orders/:orderId` — update status/notes/amount/price_pending, refresh CSV.

## Build & deploy

```sh
npm run build    # builds React app to dist/
npm run server   # can serve dist/ plus the API in production
```

Host the static `dist/` with the Express server (already configured to serve it when present). Back up `data/` or commit it to preserve orders/products.

### Production hosting (Netlify/static)

- Netlify only serves the static frontend. You still need the Node API running somewhere reachable over HTTPS (Render/Railway/Fly/any VPS). Deploy `npm run server` there with the `data/` folder.
- Set `VITE_API_BASE_URL` in Netlify environment variables to your deployed API base (e.g., `https://your-api-host.com`). If your API base already ends with `/api`, the client will de-duplicate to avoid calling `/api/api/orders`. Without this, `/api/orders` will 404 and checkout will fail.
- The API already enables CORS for all origins; if you lock it down, include your Netlify domain.
- Optional: add a CDN/edge rewrite from `/api/*` to your API host if you want to keep relative paths in the browser.

## Testing checklist

- Start API and Vite; load homepage — products should render.
- Place a test order — confirm `data/orders.json` and `data/orders.csv` update.
- Open `/admin`, enter passcode, verify order list and status updates.
- Run `node scripts/export-orders.mjs` and open the generated CSV in `/exports`.
