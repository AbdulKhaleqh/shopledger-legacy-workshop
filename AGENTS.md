# AGENTS.md

## Current stack

- Node.js with CommonJS modules.
- Express 4 serves the HTTP API and static browser app; `body-parser` parses JSON request bodies.
- The UI is plain HTML, CSS, and browser JavaScript under `public/`.
- Persistent application data is stored in `data/db.json`, read and written by `lib/store.js`.
- There is no test framework or test suite configured today.

## Module map

- `server.js`: creates the Express app, serves `public/`, mounts routes, and serves printable invoice HTML.
- `config.js`: port, shop details, tax slabs, inventory defaults, and coupons.
- `routes/`: `products.js` lists products/coupons; `orders.js` lists, creates, and cancels orders; `customers.js` lists customers and records settlements; `reports.js` serves dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/`: `store.js` handles JSON persistence and audit log; `orders.js` handles order records and filtering; `inventory.js` handles stock checks and updates; `pricing.js`, `coupons.js`, and `tax.js` calculate totals; `ledger.js` handles Khata balances and settlements; `reports.js` builds dashboard and reconciliation data; `invoice.js` calculates and renders invoices; `dates.js` provides date helpers.
- `public/`: browser UI (`index.html`, `js/app.js`, `css/style.css`).
- `data/db.json`: current local data store.

## Commands

- `npm start` — runs `node server.js` and starts the app on `PORT` or port 3000.
- `npm test` — currently a placeholder that exits with an error because no tests are configured.

## Change rules

- Before changing behaviour, write characterization tests that capture the current behaviour.
- Change only the module the ticket is about.
- Tests must never read from or write to `data/db.json`; use isolated test data or a temporary store instead.
- Add no dependencies.
