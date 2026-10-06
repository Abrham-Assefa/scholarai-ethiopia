# @scholarai/schemas

Shared JSON Schemas (draft 2020-12) used by the API (Pydantic), AI service and web app:

- `cv.schema.json` — `CVSchema` (see docs/SYSTEM_DESIGN.md §4.1)
- `scholarship.schema.json` — normalized scholarship record (seeded from `data/seed/scholarships.json`)

The Pydantic models in `services/ai/scholarai_ai/cv_maker/schema.py` and the TypeScript types in
`apps/web/src/lib/types.ts` mirror these schemas.
