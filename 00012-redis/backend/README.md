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
| `WEB_CONCURRENCY` | Optional worker process count (default: number of CPU cores, capped at 5) |

## Multi-core clustering

`src/server.js` uses Node's built-in `cluster` module. The primary process forks one worker per CPU core (`os.availableParallelism()`, or `WEB_CONCURRENCY`), up to a maximum of 5, and every worker connects to MongoDB and shares the same port.

- A worker that crashes after starting is replaced automatically.
- If a worker fails during startup (for example, MongoDB is unreachable), the whole cluster shuts down instead of restarting in a loop.
- `SIGINT`/`SIGTERM` stops every worker gracefully: it stops accepting connections, finishes in-flight requests, disconnects MongoDB, and force-exits after 10s.
- Workers keep no shared in-memory state; anything shared (cache, sessions, rate limits) must live in MongoDB or Redis.

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

## Posts (`/api/posts`)

A post has `user` (author ref), `caption`, `likes` (count, default `0`), `createdAt` and `updatedAt`.

### `POST /api/posts` (protected)

Header: `Authorization: Bearer <accessToken>`

```json
{ "caption": "Hello Redis" }
```

`201`:

```json
{
  "success": true,
  "message": "Post created",
  "data": {
    "post": { "id": "...", "user": { "id": "...", "name": "Ankur" }, "caption": "Hello Redis", "likes": 0, "createdAt": "...", "updatedAt": "..." }
  }
}
```

`401`: `{ "success": false, "message": "Authentication required", "errors": [] }`

`422`: `{ "success": false, "message": "Validation failed", "errors": [{ "field": "caption", "message": "Caption is required" }] }`

### `GET /api/posts/:postId/details` (public)

`200`: `{ "success": true, "message": "Post details", "data": { "post": { ... } } }`

`422`: `{ "success": false, "message": "Validation failed", "errors": [{ "field": "postId", "message": "Invalid post id" }] }`

`404`: `{ "success": false, "message": "Post not found", "errors": [] }`

### `PATCH /api/posts/:postId/update` (public)

Updates only the caption, then deletes the cached `post:<postId>` key from Redis so the next `/details` call reads fresh data.

```json
{ "caption": "Updated caption" }
```

`200`: `{ "success": true, "message": "Post updated", "data": { "post": { ... } } }`

`422`: `{ "success": false, "message": "Validation failed", "errors": [{ "field": "caption", "message": "Caption is required" }] }`

`404`: `{ "success": false, "message": "Post not found", "errors": [] }`

## Seeding 1 million posts

```bash
npm run seed:posts                                   # 1,000,000 posts across 1,000 seed users
npm run seed:posts -- --reset                        # delete all posts first
npm run seed:posts -- --count=50000 --users=100 --batch=5000 --concurrency=4
```

Seed users are upserted, so re-running is safe. Log in as `seed-user-<n>@example.com` / `Password123`.
