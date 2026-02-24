# Qodefly Dashboard

Landing page + dashboard for qodefly.io.

## Routes

- `/` — Landing page (public)
- `/app` — Dashboard (authenticated)
- `/app/login` — Login page

## Development

```bash
npm install
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=https://api.qodefly.io
```

## Deploy

Deployed via Coolify (Dockerfile). Output: standalone.
