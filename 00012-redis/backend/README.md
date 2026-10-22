# Auth Backend (Express + MongoDB, JavaScript ESM)

JWT access tokens + rotating, persisted refresh tokens stored in an httpOnly cookie.

Layering: `routes -> controller -> DAO -> model`. `src/services/` is reserved for third-party integrations.

## Setup

Requires Node.js 20+ and a running MongoDB.

```bash
npm install
cp .env.example .env   # then set real secrets
npm run dev            # node --watch
npm start              # production
```

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `MONGODB_URI` | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` | Secret for 15-minute access tokens |
| `REFRESH_TOKEN_SECRET` | Different secret for 7-day refresh tokens |

## Vite dev proxy

No CORS is configured; proxy API calls through Vite so cookies are same-origin:

```js
// vite.config.js
export default {
  server: {
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
};
```

## Response envelope

```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }
```

`stack` is included on failures outside production.

## Endpoints (`/api/v1/auth`)

### `POST /register`

```json
{ "name": "Ankur", "email": "ankur@example.com", "password": "pass1234" }
```

`201` (sets `refreshToken` cookie):

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "name": "Ankur", "email": "ankur@example.com", "createdAt": "...", "updatedAt": "..." },
    "accessToken": "eyJ..."
  }
}
```

`422`:

```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "password", "message": "Password must be at least 8 characters" }] }
```

`409`: `{ "success": false, "message": "Email already registered", "errors": [{ "field": "email", "message": "Email already registered" }] }`

### `POST /login`

```json
{ "email": "ankur@example.com", "password": "pass1234" }
```

`200` (sets `refreshToken` cookie): `{ "success": true, "message": "Login successful", "data": { "user": { ... }, "accessToken": "eyJ..." } }`

`401`: `{ "success": false, "message": "Invalid credentials", "errors": [] }`

### `POST /refresh`

No body; sends the `refreshToken` cookie. Rotates both tokens and resets the cookie.

`200`: `{ "success": true, "message": "Token refreshed", "data": { "accessToken": "eyJ..." } }`

`401`: `{ "success": false, "message": "Invalid refresh token", "errors": [] }` (reusing an old token also revokes the current session)

### `POST /logout`

No body. Clears the stored token and the cookie.

`200`: `{ "success": true, "message": "Logout successful", "data": null }`

### `GET /me`

Header: `Authorization: Bearer <accessToken>`

`200`: `{ "success": true, "message": "Current user", "data": { "user": { "id": "...", "name": "Ankur", "email": "ankur@example.com", "createdAt": "...", "updatedAt": "..." } } }`

`401`: `{ "success": false, "message": "Authentication required", "errors": [] }`
