# Downbot authentication API

JavaScript ESM, Express, MongoDB/Mongoose, bcrypt, and JWT. Run `npm install` from
the project root, copy `.env.example` to `.env`, configure MongoDB and distinct
32+ character token secrets, then run `npm run dev -w backend` from the root.
`npm start -w backend` runs without watch mode. MongoDB connects before HTTP starts.

Use the [frontend Vite proxy](../frontend/vite.config.js) for development:

```js
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:5001', changeOrigin: true }
  }
}
```

No CORS is needed. Production requires HTTPS and a same-origin reverse proxy.
See the [root README](../README.md) for full setup and deployment prerequisites.

## Contract

Base path: `/api/v1/auth`. JSON requests use `Content-Type: application/json`.
Requests are plain objects; responses always use the success/error envelope.
All auth responses are `Cache-Control: no-store`.

The `user` object always contains only `id`, `name`, `email`, and `createdAt`.
Passwords and refresh tokens are never returned in JSON.

### POST /register

Request:

```json
{"name":"Alex Morgan","email":"alex@example.com","password":"thoughtful1"}
```

Response: `201`, with an HTTP-only `refreshToken` cookie:

```json
{
  "success": true,
  "message": "Account created",
  "data": {
    "user": {"id":"507f1f77bcf86cd799439011","name":"Alex Morgan","email":"alex@example.com","createdAt":"2026-01-02T00:00:00.000Z"},
    "accessToken": "<access-jwt>"
  }
}
```

Validation failure: `422`:

```json
{"success":false,"message":"Validation failed","errors":[{"field":"email","message":"Enter a valid email address"}]}
```

Duplicate email: `409`, with an `email` field error.

### POST /login

Request:

```json
{"email":"alex@example.com","password":"thoughtful1"}
```

Response: `200`, replacing the refresh cookie and the previous refresh session:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {"id":"507f1f77bcf86cd799439011","name":"Alex Morgan","email":"alex@example.com","createdAt":"2026-01-02T00:00:00.000Z"},
    "accessToken": "<access-jwt>"
  }
}
```

Malformed input, unknown email, and wrong password all return `401`:

```json
{"success":false,"message":"Invalid credentials","errors":[]}
```

### POST /refresh

No request body. Send the `refreshToken` cookie (Axios uses `withCredentials`).
Response: `200`, with a rotated refresh cookie:

```json
{
  "success": true,
  "message": "Session refreshed",
  "data": {
    "user": {"id":"507f1f77bcf86cd799439011","name":"Alex Morgan","email":"alex@example.com","createdAt":"2026-01-02T00:00:00.000Z"},
    "accessToken": "<new-access-jwt>"
  }
}
```

Missing/revoked cookie: `401`:

```json
{"success":false,"message":"Session expired. Please sign in again.","errors":[]}
```

Invalid/expired JWTs return `401`, `"Invalid or expired token"`, and `errors: []`.

### POST /logout

No body. Send the refresh cookie. Response: `200`, with the same cookie path cleared:

```json
{"success":true,"message":"Logged out","data":{}}
```

No cookie is an idempotent success. A malformed/expired cookie returns `401`
and is still cleared. Stale cookies cannot invalidate newer sessions.

### GET /me

No body. Header: `Authorization: Bearer <access-jwt>`.

Response: `200`:

```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "user": {"id":"507f1f77bcf86cd799439011","name":"Alex Morgan","email":"alex@example.com","createdAt":"2026-01-02T00:00:00.000Z"}
  }
}
```

Missing bearer token: `401`:

```json
{"success":false,"message":"Authentication required","errors":[]}
```

## Other failures

Unknown routes return `404`; malformed JSON `400`; bodies over 16 KB `413`;
excess failed credential attempts `429`. All failures include `errors`, even if
empty. Unknown failures are logged and return `500` / `"Internal server error"`.
Only non-production failure responses include `stack`.

Controllers own authentication decisions. Only the DAO imports the user model.
`services/` stays empty until third-party integrations are introduced.
Shared domain and response contracts use JSDoc in `src/types/`, not TypeScript.
