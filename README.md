This is my saas template starter only use in vercel environment, use nextjs with betterauth. 

## Tech Stack:
- nextjs
- tailwindcss
- typescript
- better-auth
- kysely
- shadcn/ui
- simple icons
- lucide-react
- tanstack-query
- zustand
- claude-code
- polar-sh
- midtrans
- tanstack-form

## How to use
- clone this repository
- see the schema in **drizzle/schema.ts**, that the schema setup with initial for better-auth.
- then :
```bash
npx dk:g
```
- update the `POSTGRES_URL` in `.env`
```bash
POSTGRES_URL=postgres://localhost:5432/{name}
```
- migrate better-auth to local and remote
``` bash
npm run db:m:local
npm run db:m:remote
```
- after changes schema, generated schema with
```bash
npx dk:g
```

> [!NOTE] 
> if u want to use plugin from better-auth, add schema manually then generate and migrate.

---



## Environment Variables

To run this project, you will need to setup the following environment variables.

# .env
use this simple, just make the dev more fast.