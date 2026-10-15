# Gather — full-stack authentication

A JavaScript-only Express + MongoDB backend and Vite + React frontend. Redux
Toolkit manages authentication, loading states, and API errors. This version
implements **authentication only**, not chat, OAuth, email verification, or
password recovery.

## Getting started

Requirements: Node.js **20.19+, 22.12+, or 24+**, npm, and a running
MongoDB instance or MongoDB Atlas connection.

From this directory:

```sh
npm install
npm run setup
```

The setup command creates an ignored `server/.env` with independent random JWT
secrets. It will not overwrite an existing file. Update `MONGODB_URI` there if
you are not using a local MongoDB instance at `127.0.0.1:27017`.
`server/.env.example` documents the required configuration; its example secrets
are intentionally rejected at startup.

```sh
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:5001/api/v1/auth>
- Open **the frontend URL**; requests and cookies go through Vite's `/api` proxy.
- Use the same hostname consistently; `localhost` and `127.0.0.1` have different cookies.

Both applications can also run separately with `npm run dev -w server` and
`npm run dev -w client`.
Port 5001 avoids the port 5000 commonly occupied by macOS AirPlay.
If you change `PORT`, also update the target in `client/vite.config.js`.

## Authentication flow

- Registration and login return a public user plus a 15-minute JWT access token.
- Access tokens exist only in Redux memory, never in local/session storage.
- A 7-day refresh token lives in an httpOnly, SameSite=Strict cookie scoped to
  `/api/v1/auth`. Production additionally requires HTTPS and uses Secure cookies.
- Reloading the page restores authentication through the refresh cookie.
- Protected profile requests retry once after refreshing expired access tokens.
  Concurrent protected requests share a refresh operation.
- All frontend API requests use the shared `axios.create` instance in
  `client/src/api/apiClient.js`. Request interceptors attach the current Redux
  access token; response interceptors normalize errors, rotate expired sessions,
  and retry protected requests once. Login, registration, refresh, and logout
  never trigger automatic refresh loops. Interceptors are connected to Redux
  in `client/src/app/store.js`, without a circular store import.
- Successful Axios responses are unwrapped centrally, so `authApi` methods return
  the API's `data` directly. Redux thunks do not need to handle Axios response objects.
- Each rotation produces a unique token and atomically compares the persisted
  previous token, preventing replay or double-consumption.
- There is one current refresh session per user. A new login invalidates the
  previous refresh token, not already-issued access tokens.
- Logout invalidates the current refresh token and clears its cookie. Already
  issued bearer tokens remain valid for up to 15 minutes; this is deliberate
  stateless JWT behavior. A stale cookie cannot invalidate a newer login.
- Unavailable servers, validation errors, and failed logout attempts are displayed
  explicitly. Passwords are bcrypt-hashed with 10 rounds; registration limits them
  to 72 UTF-8 bytes to prevent bcrypt truncation.

## Finding your way around

React Router is provided by `BrowserRouter` in `client/src/main.jsx`.
The routes are declared in `client/src/App.jsx`:

| URL | Page | Access |
| --- | --- | --- |
| `/login` | `pages/LoginPage.jsx` | Signed-out users |
| `/register` | `pages/RegisterPage.jsx` | Signed-out users |
| `/account` | `pages/AccountPage.jsx` | Signed-in users |
| `/` or unknown URLs | Redirect to login or account | Based on session |

Login and registration are separate pages with their own form state and submit
handler, not modes of a single configurable page. They share `AuthLayout` for
the design, navigation tabs, and session messages, and `FormField` for labels,
validation messages, and password visibility.

To follow an API request, read these files in order:

```text
page → features/auth/authSlice.js → api/authApi.js → api/apiClient.js
```

The Redux slice uses explicit pending, fulfilled, and rejected handlers for each
operation. Small named functions share loading, session, and error updates.

## Backend architecture

```text
server/src/
  app.js, server.js
  config/          environment validation, database connection
  types/           shared JSDoc API and user shapes
  models/          Mongoose user model, password hashing
  DAO/             all user database queries
  controller/      authentication decisions and token lifecycle
  routes/          versioned endpoint wiring
  validators/      express-validator chains
  middleware/      authentication, validation, centralized errors
  utils/           JWTs, error class, response helper
  services/        reserved for third-party integrations
```

Request path: **routes → controller → DAO → model**. The backend skill has been
adapted to JavaScript as requested, so there is no TypeScript compilation step.
Only the DAO imports the user model. Success output uses one helper; failures
use the centralized error middleware. Secrets are validated before startup, and
MongoDB connects before the server starts accepting requests.
Controllers are plain async functions. Express 5 automatically forwards rejected
promises to the final error middleware, so no async-handler wrapper is needed.

## API

All routes are beneath `/api/v1/auth`. JSON requests use
`Content-Type: application/json`. All successes include `data`; all failures
include `errors`. Operational errors additionally include a stack outside production.

| Method | Path | Request | Success |
| --- | --- | --- | --- |
| POST | `/register` | `{"name":"Alex","email":"alex@example.com","password":"Password123"}` | 201, session envelope below |
| POST | `/login` | `{"email":"alex@example.com","password":"Password123"}` | 200, session envelope below |
| POST | `/refresh` | No body; refresh cookie required | 200, rotated session envelope below |
| POST | `/logout` | No body; current refresh cookie if present | 200, logout envelope below |
| GET | `/me` | No body; `Authorization: Bearer <accessToken>` | 200, profile envelope below |

Registration, login, and refresh:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Alex",
      "email": "alex@example.com",
      "createdAt": "2026-10-15T10:00:00.000Z"
    },
    "accessToken": "<jwt>"
  }
}
```

The messages for registration and refresh are respectively
`Registration successful` and `Session refreshed`. The refresh token is never
returned in JSON.

Logout:

```json
{"success":true,"message":"Logout successful","data":{}}
```

Profile:

```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Alex",
      "email": "alex@example.com",
      "createdAt": "2026-10-15T10:00:00.000Z"
    }
  }
}
```

Validation (422):

```json
{"success":false,"message":"Validation failed","errors":[{"field":"email","message":"Enter a valid email address"}]}
```

Invalid credentials (401), identical for missing users and wrong passwords:

```json
{"success":false,"message":"Invalid credentials","errors":[]}
```

Example cookie-aware requests:

```sh
curl -i -c cookies.txt http://localhost:5001/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alex","email":"alex@example.com","password":"Password123"}'
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:5001/api/v1/auth/refresh
curl -i http://localhost:5001/api/v1/auth/me -H 'Authorization: Bearer <accessToken>'
curl -i -b cookies.txt -X POST http://localhost:5001/api/v1/auth/logout
```

## Verification

```sh
npm run lint
npm run build
```

`npm run build` produces `client/dist`. Automated test code and test-runner
dependencies are not included. To check authentication manually, register an
account, reload to restore its session, refresh the protected profile, sign out,
and confirm `/account` redirects to sign-in.

## Deployment

Run the API using `npm start` with `NODE_ENV=production`, MongoDB, and strong
independent secrets. Serve `client/dist` and reverse-proxy `/api` to the API
**under the same HTTPS origin**. Configure the static server's history fallback
to `index.html` so `/login`, `/register`, and `/account` work on reload.
Vite's development proxy is not part of the production build; no CORS is needed
for the supported same-origin arrangement:

```js
server: {
  proxy: { '/api': { target: 'http://127.0.0.1:5001', changeOrigin: true } }
}
```

Before a public launch, add infrastructure-level login rate limiting, monitoring,
and any required account recovery/verification flow. These are outside this
authentication-only scaffold.
