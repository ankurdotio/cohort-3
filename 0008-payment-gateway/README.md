# Payment Gateway

## Seed sample products

Set `MONGO_URI` in `.env`, then run from this directory:

```sh
npm run seed
```

The script adds 10 sample products with INR prices to the configured MongoDB
database and closes the connection when finished. It preserves existing products.
Each run inserts another 10 products, so repeated runs create duplicates.
Failures are logged and return a non-zero exit code.
