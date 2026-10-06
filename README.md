# ScholarAI Ethiopia 🇪🇹

AI platform helping Ethiopian students **find scholarships, build world-class CVs, and never miss a deadline** — in English and አማርኛ.

> MVP monorepo: Next.js 15 web app · FastAPI API · Python AI modules (works fully **offline** with a deterministic mock LLM) · 40 real scholarships + 25 funded conferences as seed data.

## Quick start

### Option A — Docker (one command)

```bash
docker compose up --build
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Web      | http://localhost:3000        |
| API      | http://localhost:8000        |
| API docs | http://localhost:8000/docs   |
| Postgres | `localhost:5432` (scholarai) |

### Option B — local dev servers

Requires Python ≥ 3.11 ([uv](https://docs.astral.sh/uv/) recommended) and Node 20.

```bash
# API (SQLite, auto-seeds on first start)
cd services/api
uv venv --python 3.12 && uv pip install -e ../ai -e ".[dev]"
.venv/bin/uvicorn app.main:app --reload --port 8000

# Web
cd apps/web
npm install
npm run dev            # http://localhost:3000 → redirects to /en
```

**Demo login:** any phone number + OTP code `123456`. The web app logs in silently with a device-local phone when you finish onboarding or save a CV.

No `OPENAI_API_KEY` is needed — the `mock` provider gives deterministic answers (including Amharic). Set the key to switch to OpenAI automatically.

## What's in the box

```
scholarai-ethiopia/
├── apps/web/          Next.js 15 (App Router) · TypeScript · Tailwind v4 · shadcn-style UI · next-intl (en/am) · PWA
├── services/api/      FastAPI · SQLAlchemy 2 · Pydantic v2 · JWT demo auth · SQLite (dev) / Postgres (prod)
├── services/ai/       LLMRouter (mock | openai) · cv_maker · matcher · chat_agent · essay_coach
├── packages/schemas/  JSON Schemas: CVSchema, Scholarship
├── data/seed/         scholarships.json (40) + conferences.json (25), parsed from docs/OPPORTUNITIES.md
├── docs/              SYSTEM_DESIGN.md · OPPORTUNITIES.md
├── docker-compose.yml postgres · redis · api · web
└── .github/workflows/ci.yml
```

### Features

| Area          | What works                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Matching**  | Hard filters (level, deadline, nationality) + TF-IDF similarity + weighted scoring → probability 0–100 with `why[]` / `missing[]` explanations and effort hours |
| **CV Maker**  | Form → CVSchema JSON, live preview, `europass` / `modern` templates, STAR-method bullet enhancer with an **honesty guard** (never invents numbers), ATS score 0–100 with suggestions, PDF export (ReportLab), Ethiopian GPA → German / UK / US |
| **Assistant** | RAG over seed scholarships with tool calls `search_scholarships` / `get_deadlines`, replies in `en` or `am`, cites sources                                      |
| **Essay coach** | Clarity / specificity / word-count / cliché feedback + rubric score (`POST /v1/essays/feedback`)                                                                |
| **Web**       | Landing with live counts + EN/አማርኛ switcher, 5-step onboarding wizard, dashboard (probability rings + deadline radar), scholarship search & filters, detail pages, conferences, dark mode, mobile-responsive, PWA manifest |

### Screenshots

> Run the app and visit `/en` (landing), `/en/dashboard`, `/en/cv`, `/am/assistant`. _Add screenshots here._

## Architecture

```mermaid
flowchart LR
  subgraph Web[apps/web · Next.js 15]
    UI[Pages: landing · onboarding · dashboard · scholarships · cv · assistant · conferences]
  end
  subgraph API[services/api · FastAPI]
    R[/v1 routers/] --> DB[(SQLite / Postgres)]
  end
  subgraph AI[services/ai]
    Router[LLMRouter<br/>mock | openai]
    Matcher
    CV[cv_maker<br/>parser · enhancer · ats · render]
    Chat[chat_agent · RAG + tools]
    Essay[essay_coach]
  end
  UI -- fetch (JWT) --> R
  R --> Matcher & CV & Chat & Essay
  CV & Chat & Essay --> Router
  Seed[data/seed/*.json] --> DB
```

- **Auth**: `POST /v1/auth/otp/request` → `POST /v1/auth/otp/verify {phone, code:"123456"}` → Bearer JWT.
- **Catalog**: `GET /v1/scholarships?level=&country=&field=&q=&deadlineAfter=&funding=`, `GET /v1/scholarships/stats`, `GET /v1/scholarships/{id}`, `GET /v1/conferences`.
- **Me**: `GET|PUT /v1/me/profile` (PUT recomputes matches), `GET /v1/matches`, `GET /v1/deadlines?days=90`, `GET|POST /v1/reminders`.
- **CV**: `POST /v1/cv`, `GET|PUT /v1/cv/{id}`, `POST /v1/cv/{id}/enhance`, `GET /v1/cv/{id}/score`, `POST /v1/cv/{id}/export` (PDF), `POST /v1/tools/gpa`.
- **AI**: `POST /v1/chat {message, lang, history}`, `POST /v1/essays/feedback`.

Full design: [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md).

## Environment variables

| Variable              | Default                                      | Notes                                                  |
| --------------------- | -------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`        | `sqlite:///<repo>/services/api/data/scholarai.db` | Use `postgresql+psycopg://…` in prod (compose does)    |
| `ENV`                 | `dev`                                        | `prod` in compose                                      |
| `JWT_SECRET`          | dev secret                                   | **Change in prod**                                     |
| `DEMO_OTP_CODE`       | `123456`                                     | Demo OTP accepted for any phone                        |
| `OPENAI_API_KEY`      | _(empty)_                                    | When set, `LLM_PROVIDER` auto-switches to `openai`     |
| `LLM_PROVIDER`        | `auto`                                       | `mock` · `openai` · `auto`                             |
| `CORS_ORIGINS`        | `http://localhost:3000`                      | Comma-separated; localhost on any port is always allowed |
| `SEED_DIR`            | `<repo>/data/seed`                           | Auto-seeds when the scholarships table is empty        |
| `STORAGE_DIR`         | `<repo>/services/api/storage`                | Exported PDFs                                          |
| `SCHOLARAI_FONT_PATH` | _(unset)_                                    | Path to `NotoSansEthiopic-Regular.ttf` for Amharic PDFs |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000`                      | Web → API base URL (build-time for Docker)             |

## Tests & quality

```bash
# AI modules (19 tests: GPA converter, CV parser/ATS/enhancer, matcher, chat, essay coach)
cd services/ai && .venv/bin/pytest -q && .venv/bin/ruff check .

# API (11 tests, in-memory SQLite)
cd services/api && .venv/bin/pytest -q && .venv/bin/ruff check .

# Web
cd apps/web
npm run lint && npm run typecheck && npm test      # ESLint, tsc, Vitest (7 tests)
npx playwright install chromium && npm run test:e2e # Playwright smoke (needs API on :8000)

# Regenerate conferences seed from docs/OPPORTUNITIES.md
# (scholarships.json is curated from web research and is not regenerated)
python data/seed/build_seed.py
```

CI (`.github/workflows/ci.yml`) runs ruff + pytest for `ai` and `api`, lint/typecheck/vitest/build for `web`, and verifies the conferences seed is in sync with the docs. `data/seed/scholarships.json` is a curated, web-researched dataset (46 programmes open to Ethiopians, each with overview, eligibility, benefits, how-to-apply steps, documents, selection, Ethiopia-specific tips, sources and a `deadlineConfirmed` flag).

## Roadmap (post-MVP)

Telegram/SMS reminders (Celery + Redis), real OTP provider, embeddings-based matching with pgvector, essay coach UI, Amharic PDF font bundling, admin curation UI for scholarships, analytics.

## Disclaimer

Deadlines and eligibility change every year. ScholarAI never guarantees admission or visas — always confirm on the official scholarship website.
