# Generated API types

This folder will contain `schema.d.ts` — TypeScript types auto-generated from the NestJS Swagger spec.

## Generating

1. Start the backend: `cd ../../../ehc-backend && npm run start:dev`
2. From the frontend: `npm run gen:api`
3. Commit the resulting `schema.d.ts`

The output gives you typed paths and operations. Use it like:

```ts
import type { paths } from "@/lib/api/generated/schema";

type SermonListResponse =
  paths["/sermons/published"]["get"]["responses"]["200"]["content"]["application/json"];
```

## When to regenerate

After every backend API change. Consider wiring this into CI as a check that the committed types match the live spec.
