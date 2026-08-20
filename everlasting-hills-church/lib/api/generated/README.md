# Generated API types

This folder will contain `schema.d.ts` — TypeScript types auto-generated from the NestJS Swagger spec.

## Generating

From the repository root, the backend does not need to be running and no
external service is contacted:

1. Generate the deterministic document: `npm --prefix ehc-backend run openapi:generate`
2. Generate types: `npm --prefix everlasting-hills-church run gen:api`
3. Commit both `ehc-backend/openapi/openapi.json` and the resulting `schema.d.ts`

The output gives you typed paths and operations. Use it like:

```ts
import type { paths } from "@/lib/api/generated/schema";

type SermonListResponse =
  paths["/sermons/published"]["get"]["responses"]["200"]["content"]["application/json"];
```

## When to regenerate

After every backend API change. CI regenerates both artifacts and fails when the
committed contract has drifted.
