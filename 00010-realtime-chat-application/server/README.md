# Authentication API

This backend follows routes → controller → DAO → model and uses JavaScript ESM.
See the [project README](../README.md) for configuration, all five endpoint
examples, frontend proxy wiring, cookie behavior, and deployment requirements.

From the project root:

```sh
npm install
npm run setup
npm run dev -w server
```

Configure `server/.env` with a reachable MongoDB URI before starting.
The API starts only after MongoDB connects. `npm run start -w server` runs
without file watching. JavaScript requires no TypeScript build/typecheck step.
