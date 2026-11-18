# Downbot

A calm, authentication-only starting point for a future multi-model AI chat app.
Includes registration, login, rotating sessions, a protected account page, and logout.
No chat, OAuth, email verification, or password-reset functionality is implemented.

## Run locally

Requirements: Node.js **22.22+** and MongoDB. The backend itself uses plain JavaScript
ES modules; the Node minimum accommodates the frontend tooling.

```sh
npm install
cp backend/.env.example backend/.env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Run the command twice. Put different values in ACCESS_TOKEN_SECRET and
# REFRESH_TOKEN_SECRET in backend/.env. Start MongoDB and set MONGODB_URI.
npm run dev
```

Open **http://127.0.0.1:5173**. The API listens on port **5001** (avoiding macOS AirPlay's port 5000). Keep the same
hostname while testing; switching between localhost and 127.0.0.1 changes cookies.
Do not commit `.env` or use the same signing secret for both token types.

## Architecture

```text
backend/src/
  routes/ -> controller/ -> DAO/ -> models/
  config/       environment validation and database connection
  middleware/   authentication, validation, centralized failures
  validators/   express-validator rules
  utils/        JWT, response helpers, AppError
  types/        shared JavaScript JSDoc domain/response contracts
  services/     reserved for future third-party integrations

frontend/src/
  app/          application routing and Redux store
  features/auth/
    API/        Axios requests and single-flight refresh/retry
    State/      Redux Toolkit auth slice
    Hooks/      form state, validation, API orchestration, session lifecycle
    UI/         pages and presentational components
```

Future features should each own these same four frontend layers. UI components
never call Axios or dispatch Redux actions directly. Hooks connect API and State.
The API layer receives session callbacks rather than importing the store.

The backend follows the `backend-boilerplate` skill, deliberately adapted to
**JavaScript**: `.js` files, JSDoc contracts, and Node's native watch mode replace
TypeScript, declaration files, compilation, and `tsx`. No application service layer.

## Proxy, cookies, and sessions

All browser requests use relative `/api/v1/auth` URLs. Vite forwards `/api`:

```js
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:5001', changeOrigin: true }
  }
}
```

There is **no CORS dependency or middleware**. If the backend port changes, update
the target in [frontend/vite.config.js](./frontend/vite.config.js).

- Access JWTs expire after 15 minutes and live only in Redux memory, not local or
  session storage. Reload restores the session through the refresh cookie.
- Refresh JWTs expire after seven days. The HTTP-only cookie uses `SameSite=Strict`,
  path `/api/v1/auth`, and `Secure` in production.
- One active refresh session per account. A new login replaces the previous one.
- Rotation checks the stored token and uses an atomic compare-and-swap. Unique
  JWT IDs prevent identical same-second tokens. Old cookies cannot be replayed.
- Logout removes the stored refresh token and browser cookie. Already-issued
  access tokens remain valid until their 15-minute expiry (stateless JWT behavior).
- Concurrent refresh requests in one tab share a promise. Separate tabs/devices
  do not coordinate rotations; a losing tab must sign in again.
- Passwords use bcrypt with 10 rounds. Registration requires 8+ characters,
  a letter, a number, and at most 72 UTF-8 bytes to avoid bcrypt truncation.
- Failed login/registration attempts are rate limited to 30 per IP per 15 minutes.
  The limiter is in-memory; use a shared store for multiple API instances.
- Outages show actionable errors instead of silently appearing signed out.

## Validation

```sh
npm run lint
npm test
npm run build
```

Backend tests launch an isolated MongoDB through `mongodb-memory-server`; the
first run may download a MongoDB binary. An installed binary can be reused:

```sh
MONGOMS_SYSTEM_BINARY="$(command -v mongod)" npm test
```

Tests cover the auth lifecycle, generic credential errors, validation, safe
response shapes, cookie options, token replay/concurrency, session revocation,
Axios retry behavior, route guards, and form failure states.
There is no TypeScript compilation step; ESLint, integration tests, and Vite's
production build validate the JavaScript implementation.

## Production

`npm run build` creates `frontend/dist`. Serve it with an HTTPS reverse proxy that:

1. Proxies `/api/*` to the Express API, without stripping the `/api` prefix.
2. Serves the Vite output and falls back to `index.html` for frontend routes.
3. Keeps the frontend and API on **the same origin**.

Set `NODE_ENV=production` in the backend environment, provide MongoDB and two
strong secrets, and run `npm start`. The API does not serve frontend static files,
and Vite's development proxy is not a production server. The start script reads
`backend/.env`; infrastructure-provided variables take precedence.
Before deploying behind a proxy, configure Express `trust proxy` for the actual
trusted proxy topology so IP rate limiting is correct; do not blindly trust all proxies.

## Design

The [Google Stitch design](https://stitch.withgoogle.com/projects/11127232767386413252)
provided the off-white canvas, sage editorial panel, forest-green controls,
stacked-card artwork, and generous split layout. Registration and account views
share that visual language. Tailwind CSS styles the implementation; fonts are
self-hosted. AI model names on the account page describe the future direction,
not available integrations.

Light and dark themes follow the operating system's `prefers-color-scheme`
setting automatically. All colors are semantic tokens in
`frontend/src/styles.css`; the dark palette overrides those tokens in one media
query, so components never hard-code colors.

See [backend API documentation](./backend/README.md) for all request/response examples.
