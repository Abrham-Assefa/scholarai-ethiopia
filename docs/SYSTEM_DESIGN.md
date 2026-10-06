# ScholarAI Ethiopia — Full System Design

> An AI-powered platform that helps Ethiopian students **find scholarships, build CVs, write essays, prepare documents, and practice interviews** — available as a **Website**, **Mobile App**, and **Telegram Bot**.

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Target Users & Personas](#2-target-users--personas)
3. [High-Level Architecture](#3-high-level-architecture)
4. [AI Modules (Deep Dive)](#4-ai-modules-deep-dive)
   - 4.1 CV / Resume AI Maker
   - 4.2 Scholarship Matching Engine
   - 4.3 Essay & Motivation Letter Coach
   - 4.4 Multilingual Chat Assistant (Amharic / Afaan Oromo / Tigrinya / English)
   - 4.5 Document Intelligence (OCR + Verification)
   - 4.6 Interview Simulator
   - 4.7 Deadline & Opportunity Radar (Scraper + Classifier)
   - 4.8 Recommendation Letter Helper
5. [Website (Web App) Design](#5-website-web-app-design)
6. [Mobile App Design](#6-mobile-app-design)
7. [Telegram Bot](#7-telegram-bot)
8. [UI / UX Design System](#8-ui--ux-design-system)
9. [Backend Design](#9-backend-design)
10. [Database Schema](#10-database-schema)
11. [API Specification](#11-api-specification)
12. [AI Pipelines & Prompt Engineering](#12-ai-pipelines--prompt-engineering)
13. [Security, Privacy & Compliance](#13-security-privacy--compliance)
14. [Infrastructure & DevOps](#14-infrastructure--devops)
15. [Offline-First & Low-Bandwidth Strategy](#15-offline-first--low-bandwidth-strategy)
16. [Monetization & Sustainability](#16-monetization--sustainability)
17. [Roadmap](#17-roadmap)
18. [Repository Structure](#18-repository-structure)

---

## 1. Vision & Goals

| Goal | Description |
|------|-------------|
| **Discover** | Aggregate every scholarship open to Ethiopians (local + international) in one place. |
| **Match** | Use AI to rank scholarships by eligibility probability for each student profile. |
| **Prepare** | Generate world-class CVs, essays, and recommendation drafts tailored to each scholarship. |
| **Guide** | Explain complicated requirements (MoE authentication, apostille, IELTS, etc.) in local languages. |
| **Remind** | Never miss a deadline — alerts via Telegram, SMS, push, and email. |
| **Include** | Work on low-end Android phones, 2G/3G networks, and offline. |

### Success Metrics
- Scholarships indexed: **> 2,000** active listings
- Match precision@5: **> 80%**
- CV generation time: **< 20 s**
- Mobile app size: **< 15 MB**
- Monthly active students: **100k in year 2**

---

## 2. Target Users & Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Hanna** — Grade 12 graduate, Addis Ababa | Scored 520 on national exam, wants undergraduate scholarship abroad | Simple matching, Amharic UI, free CV |
| **Dawit** — 3rd-year Engineering student, Bahir Dar | Wants Master's abroad (DAAD, Chevening) | Essay feedback, deadline tracker, IELTS guidance |
| **Selam** — Working professional, Mekelle | Needs a Master's in Public Health (MasterCard Foundation) | Professional CV, recommendation letter templates |
| **Teacher / Counselor** | High-school counselor managing 200 students | Bulk tracking dashboard, exportable reports |
| **University Admin** | Partner university verifying transcripts | Document verification API |

---

## 3. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                               CLIENTS                                        │
│  ┌──────────────┐   ┌──────────────────┐   ┌─────────────┐   ┌───────────┐ │
│  │ Web (Next.js)│   │ Mobile (Flutter) │   │ Telegram Bot│   │ USSD/SMS  │ │
│  └──────┬───────┘   └────────┬─────────┘   └──────┬──────┘   └─────┬─────┘ │
└─────────┼────────────────────┼────────────────────┼────────────────┼────────┘
          │                    │                    │                │
          └────────────────────┴─────────┬──────────┴────────────────┘
                                         ▼
                         ┌────────────────────────────┐
                         │   API Gateway (Kong/Nginx) │
                         │   Auth · Rate-limit · CDN  │
                         └─────────────┬──────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          CORE SERVICES (FastAPI / Node)                      │
│  ┌────────────┐ ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────┐│
│  │ Auth/User  │ │ Scholarship │ │ Application  │ │ Notification Service    ││
│  │ Service    │ │ Catalog     │ │ Tracker      │ │ (Push/SMS/Telegram/Email)││
│  └────────────┘ └─────────────┘ └──────────────┘ └─────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           AI SERVICES LAYER (Python)                         │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐│
│  │ CV Maker │ │ Matcher   │ │ Essay    │ │ Chat     │ │ Doc OCR │ │Interview││
│  │ Agent    │ │ (RAG+Rank)│ │ Coach    │ │ Assistant│ │ & Verify│ │Simulator││
│  └──────────┘ └───────────┘ └──────────┘ └──────────┘ └─────────┘ └───────┘│
│          ┌──────────────────────────────────────────────────────┐          │
│          │ LLM Router: GPT-4o / Claude / Gemini / Local Llama-3 │          │
│          └──────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               DATA LAYER                                     │
│  PostgreSQL │ Redis │ Qdrant (vectors) │ S3/MinIO (files) │ Elasticsearch   │
└──────────────────────────────────────────────────────────────────────────────┘
                                       ▲
┌──────────────────────────────────────────────────────────────────────────────┐
│                  INGESTION PIPELINE (Airflow / Celery Beat)                   │
│  Scrapers → Cleaner → LLM Classifier → Dedup → Embedding → Index            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Principles
- **Microservices-lite**: a modular monolith for core, separate AI workers for heavy tasks.
- **Async everything**: AI jobs go through a queue (Celery + Redis/RabbitMQ); clients poll or receive WebSocket/push events.
- **LLM-agnostic**: a router picks the cheapest capable model; falls back to local Llama-3 when APIs fail or for privacy-sensitive data.
- **Multilingual by design**: every text field stores `lang` and has translation caching.

---

## 4. AI Modules (Deep Dive)

### 4.1 CV / Resume AI Maker 🧠📄

**Goal:** Turn a student's raw information (even messy Amharic text or a voice note) into a polished, scholarship-targeted CV in under 20 seconds, in multiple formats (Europass, Harvard, DAAD, Chevening style).

#### Input Modes
| Mode | Description |
|------|-------------|
| **Guided Form** | Step-by-step wizard (Education → Experience → Skills → Awards → Languages). |
| **Chat Interview** | AI asks questions conversationally in Amharic/English and fills the CV. |
| **Upload Old CV** | PDF/DOCX/Image → OCR → parse → improve. |
| **Voice** | Student speaks (Whisper STT supports Amharic); AI structures the content. |
| **LinkedIn Import** | Paste profile URL or export. |

#### Pipeline

```
Raw Input ──► Parser (LLM structured output → CVSchema JSON)
          ──► Gap Detector (missing sections, weak bullets)
          ──► Enhancer (STAR-method bullets, quantify impact, action verbs)
          ──► Targeting Engine (rewrite for a specific scholarship's rubric)
          ──► ATS Scorer (keyword coverage, formatting checks)
          ──► Translator (EN ⇄ AM ⇄ OM)
          ──► Renderer (React-PDF / LaTeX / DOCX templates)
          ──► Output: PDF, DOCX, shareable link, JSON
```

#### CV Data Schema (`CVSchema`)
```json
{
  "personal": { "fullName": "", "email": "", "phone": "", "city": "", "links": [] },
  "summary": "",
  "education": [{ "institution": "", "degree": "", "field": "", "gpa": "", "scale": "4.0", "start": "", "end": "", "honors": [] }],
  "experience": [{ "org": "", "role": "", "start": "", "end": "", "bullets": [] }],
  "projects": [{ "name": "", "description": "", "tech": [], "link": "" }],
  "skills": { "technical": [], "soft": [], "tools": [] },
  "languages": [{ "name": "Amharic", "level": "Native" }],
  "awards": [], "certifications": [], "volunteering": [], "publications": [],
  "meta": { "targetScholarshipId": null, "template": "europass", "lang": "en" }
}
```

#### Key AI Features
1. **Bullet Enhancer** — turns "I was a tutor" into "Tutored 40+ Grade-10 students in mathematics, raising average scores by 18% over one semester."
2. **GPA Converter** — Ethiopian 4.0 scale ↔ German 1–5 (Bavarian formula) ↔ UK classification ↔ US percentile.
3. **Scholarship Targeting** — reads scholarship criteria (e.g., Chevening = leadership + networking) and reorders/rewrites sections to emphasize them.
4. **ATS & Rubric Score** — 0–100 score with explanations and one-click fixes.
5. **Gap Filler Suggestions** — "You have no volunteering. Here are 5 ways Ethiopian students commonly gain it (Red Cross, EYVA, church/mosque youth groups…)."
6. **Honesty Guard** — flags exaggerations; refuses to invent degrees or employers.
7. **Version History** — every CV variant saved per scholarship.

#### Templates
- `europass` (EU scholarships), `academic` (research/PhD), `harvard` (US), `daad`, `chevening`, `modern-creative`, `ethiopian-gov` (for local scholarships, Amharic-first).

#### Rendering Stack
- **Web:** `@react-pdf/renderer` for instant preview; server-side Puppeteer for pixel-perfect PDF.
- **Mobile:** server renders; app downloads/caches PDF.
- **DOCX:** `docx` (npm) library.
- **Fonts:** Noto Sans Ethiopic (for Ge'ez script), Inter, Lora.

---

### 4.2 Scholarship Matching Engine 🎯

**Hybrid approach:** Rule-based hard filters + vector semantic similarity + LLM re-ranking.

```
Student Profile
   │
   ├─► Hard Filters (SQL):   nationality=ET ✓, degree level, age, deadline > today
   │
   ├─► Vector Retrieval (Qdrant): embed(profile_text) ~ embed(scholarship_text)  top-100
   │
   ├─► Feature Scorer (LightGBM):
   │        GPA fit, field match, language test fit, funding type, past acceptance stats
   │
   └─► LLM Re-ranker (top-20): explain "Why you match" + "What you're missing"
            │
            ▼
   Ranked list with Eligibility Probability (0–100%) + Action Items
```

#### Profile Features
- Degree level sought, field (ISCED code), GPA (normalized), national exam score, English test (IELTS/TOEFL/Duolingo), work experience years, leadership indicators, financial need, disability, gender, region (for regional quotas), publications.

#### Output Example
```json
{
  "scholarship": "DAAD EPOS Master's",
  "probability": 0.78,
  "why": ["2+ years work experience ✓", "Engineering field ✓", "GPA 3.6 above 3.0 threshold ✓"],
  "missing": ["IELTS 6.0 (you have none) — register at British Council Addis"],
  "deadline": "2026-10-31",
  "effortHours": 25
}
```

---

### 4.3 Essay & Motivation Letter Coach ✍️

- **Brainstorm Mode:** AI interviews the student to surface stories (challenges, leadership, community impact).
- **Outline Generator:** builds structure matching the prompt (e.g., Chevening's 4 essays).
- **Draft Feedback:** inline comments on clarity, specificity, authenticity, word count, cliché detection, grammar.
- **Rubric Scoring:** against scholarship-specific rubrics (leadership, impact, fit).
- **Plagiarism & AI-Detection Safeguard:** encourages the student's own voice; the tool rewrites *only on request* and marks AI-edited passages.
- **Translate-to-Think:** student writes in Amharic, AI helps restructure in English while preserving meaning.

---

### 4.4 Multilingual Chat Assistant 💬

- Languages: **Amharic, Afaan Oromo, Tigrinya, Somali, English**.
- RAG over: scholarship catalog, visa guides, MoE authentication steps, IELTS prep, university FAQs.
- Tools the agent can call: `search_scholarships`, `get_deadlines`, `create_cv`, `set_reminder`, `explain_requirement`, `convert_gpa`.
- Voice in/out (Whisper + TTS) for low-literacy users.
- Guardrails: never gives legal/visa guarantees; cites sources; escalates to human counselors (partner NGOs).

---

### 4.5 Document Intelligence (OCR + Verification) 📑

- OCR engine: Tesseract (Amharic model) + cloud OCR fallback.
- Extracts: transcripts, degree certificates, passport MRZ, national ID, recommendation letters.
- **Checklist Generator:** per scholarship, auto-checks uploaded docs vs. required list.
- **Quality Checker:** blur detection, missing stamp/seal detection, page completeness.
- **Translation Assistant:** certified-translation-ready drafts (AM → EN) with disclaimer.
- **Authenticity hints:** flags inconsistent dates/names across documents.

---

### 4.6 Interview Simulator 🎤

- Scholarship-specific question banks (Chevening, Fulbright, MCF, Erasmus).
- Real-time voice or text mock interview; AI acts as panelist.
- Feedback: content, structure (STAR), confidence markers, filler words, pacing.
- Records and compares progress over sessions.

---

### 4.7 Deadline & Opportunity Radar 📡

```
Sources: scholarship portals, university pages, embassies, Telegram channels, RSS, Twitter/X, partner feeds
   ↓ Scrapers (Playwright/Scrapy) — scheduled via Airflow
   ↓ Cleaner & Normalizer
   ↓ LLM Extractor → { title, provider, country, level, fields, funding, eligibility, deadline, link }
   ↓ Dedup (MinHash + embedding similarity)
   ↓ Eligibility Classifier (open to Ethiopians? yes/no/partial)
   ↓ Human-in-the-loop review queue for low-confidence items
   ↓ Index to Postgres + Qdrant + Elasticsearch
   ↓ Trigger notifications to matching students
```

---

### 4.8 Recommendation Letter Helper 📝

- Generates **a brag-sheet** the student sends to professors.
- Drafts letter outlines a professor can customize (ethically labeled as draft-for-recommender).
- Tracks recommender status and sends polite reminders.

---

## 5. Website (Web App) Design

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, next-intl (i18n), PWA (offline).

### Pages & Routes
| Route | Description |
|-------|-------------|
| `/` | Landing: hero, live counter of open scholarships, testimonials, language switcher |
| `/onboarding` | 5-step profile wizard (goal → education → scores → interests → notifications) |
| `/dashboard` | Match cards, upcoming deadlines, application progress, AI tips of the day |
| `/scholarships` | Search + filters (country, level, field, funding, deadline), map view |
| `/scholarships/[id]` | Details, eligibility meter, required docs checklist, "Apply with AI" CTA |
| `/cv` | CV Builder: left form/chat, right live preview, template switcher, score panel |
| `/cv/[id]/export` | PDF/DOCX download, share link |
| `/essays` | Essay workspace with AI side panel (comments, rubric score) |
| `/documents` | Upload vault, OCR status, checklist per scholarship |
| `/interview` | Mock interview room (voice/text) |
| `/assistant` | Full-screen chat assistant |
| `/applications` | Kanban: Researching → Preparing → Submitted → Interview → Result |
| `/counselor` | Counselor dashboard for schools (bulk student tracking) |
| `/settings` | Language, notifications (Telegram link), privacy, data export |
| `/admin` | Review queue, scraper health, analytics |

### CV Builder UI Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│  ScholarAI   CV Builder        Template: [Europass ▼]  Lang: [EN▼]  │
├───────────────────────────┬─────────────────────────────────────────┤
│ ◉ Personal   ○ Education  │                                         │
│ ○ Experience ○ Skills     │          LIVE PDF PREVIEW               │
│ ○ Awards     ○ Languages  │       (updates as you type)             │
│                           │                                         │
│  [ Form / Chat toggle ]   │                                         │
│  ┌─────────────────────┐  │                                         │
│  │ AI: "Tell me about  │  │                                         │
│  │ your last role…"    │  │                                         │
│  └─────────────────────┘  │                                         │
│  ✨ Enhance bullets       │                                         │
│  🎯 Target: DAAD EPOS     │                                         │
├───────────────────────────┴─────────────────────────────────────────┤
│  ATS Score 82/100  ▓▓▓▓▓▓▓▓░░   3 suggestions   [Download PDF] [DOCX]│
└─────────────────────────────────────────────────────────────────────┘
```

### Web Performance Targets
- LCP < 2.5 s on 3G; initial JS < 150 KB; images via AVIF/WebP; SSR for public pages.

---

## 6. Mobile App Design

**Stack:** Flutter (single codebase Android/iOS), Riverpod, Dio, Drift (SQLite offline), Firebase Cloud Messaging, flutter_localizations.
**Why Flutter:** small APK, strong Ethiopic font rendering, works well on low-end devices.

### Navigation (Bottom Tabs)
1. **Home** — matches, deadlines countdown, daily tip
2. **Explore** — search/filter scholarships, save ❤️
3. **Build** — CV Maker, Essays, Documents (hub)
4. **Assistant** — chat/voice
5. **Me** — profile, applications, settings

### Key Screens
| Screen | Highlights |
|--------|------------|
| Splash/Onboarding | Language choice first (አማርኛ / Afaan Oromoo / ትግርኛ / English) |
| Profile Wizard | Large tap targets, progress bar, voice input button |
| Match Feed | Swipeable cards; "78% match" ring; swipe right to save, left to hide |
| Scholarship Detail | Sticky deadline countdown; checklist with camera upload |
| CV Maker (Chat) | Conversational builder; preview as paged images; export PDF |
| Document Scanner | Edge detection, auto-crop, OCR, quality warnings |
| Interview | Push-to-talk, waveform, instant feedback |
| Notifications | Deadline alerts, new matches, recommender reminders |

### Mobile-Specific Features
- **Offline mode:** cached scholarships, draft CVs; sync when online.
- **Data saver:** text-only mode, image compression.
- **Lite APK:** < 15 MB using deferred components.
- **Share to Telegram** one-tap.
- **SMS/USSD fallback** for feature phones (deadline reminders).

---

## 7. Telegram Bot

Telegram is the most-used platform among Ethiopian students, so the bot is a first-class client.

Commands:
```
/start        – choose language, link account
/match        – top 5 scholarships for me
/deadlines    – upcoming deadlines
/cv           – build/update CV via chat, receive PDF
/ask <q>      – ask the assistant anything
/remind       – manage alerts
/essay        – get feedback on pasted essay
```
Built with `aiogram` (Python), shares the same API/AI services; inline buttons for navigation; web-app mini-apps for CV preview.

---

## 8. UI / UX Design System

### Brand
- **Name:** ScholarAI Ethiopia (ስኮላር AI)
- **Colors:** Primary Green `#078C3F`, Gold `#F2B705`, Red accent `#D91E36` (Ethiopian flag inspired, used tastefully), Neutral slate scale, Dark mode supported.
- **Typography:** Inter (Latin), Noto Sans Ethiopic (Ge'ez), sizes 14/16/20/24/32.
- **Icons:** Lucide.
- **Components:** Buttons, Cards (Match card, Deadline card), Progress Ring, Stepper, Chat Bubble, Score Gauge, File Dropzone, Checklist, Kanban column.

### UX Principles
1. **Language first** — pick language before anything.
2. **One task per screen** on mobile.
3. **Explain every AI output** ("Why this match?").
4. **Celebrate progress** (confetti on submission 🎉).
5. **Accessibility:** WCAG 2.1 AA, screen-reader labels, voice navigation.

---

## 9. Backend Design

### Services
| Service | Stack | Responsibilities |
|---------|-------|------------------|
| **api-gateway** | Nginx/Kong | TLS, routing, rate limiting, JWT validation |
| **auth-service** | FastAPI + Keycloak/Auth.js | Phone OTP (Ethio Telecom SMS), Google, Telegram login, roles |
| **user-service** | FastAPI | Profiles, preferences, GDPR export/delete |
| **catalog-service** | FastAPI | Scholarships CRUD, search (Elasticsearch), filters |
| **match-service** | Python | Hybrid matcher, scheduled re-matching |
| **cv-service** | Python + Node render worker | CV parsing, enhancing, rendering |
| **essay-service** | Python | Feedback, rubric scoring |
| **doc-service** | Python | OCR, checklist, file handling (S3 presigned URLs) |
| **chat-service** | Python (LangGraph) | Agentic assistant with tools, memory |
| **interview-service** | Python | STT/TTS, question banks, scoring |
| **notification-service** | Node/Go | FCM, Telegram, SMS (Africa's Talking / Ethio Telecom), Email (Resend) |
| **ingestion-pipeline** | Airflow + Scrapy/Playwright | Scraping, extraction, dedup, indexing |
| **admin-service** | FastAPI | Review queue, analytics, feature flags |

### Async Job Flow
```
Client → POST /cv/generate → 202 { jobId }
       → Celery task (cv-worker) → LLM → render → S3
       → Publish event "cv.ready" → WebSocket / FCM push
Client → GET /jobs/{jobId} → { status, resultUrl }
```

### LLM Router
```python
class LLMRouter:
    def pick(self, task: Task) -> Model:
        if task.privacy == "high":      return LocalLlama3_70B
        if task.type == "extract":      return GPT4oMini      # cheap, structured
        if task.type == "essay_coach":  return Claude         # nuanced writing
        if task.lang in ("am", "om"):   return Gemini         # better Amharic
        return GPT4o
```
- Caching: semantic cache (Redis + embeddings) to cut cost ~40%.
- Observability: Langfuse for traces, token cost per user.
- Guardrails: prompt-injection filter, PII redaction before external API calls, output schema validation (Pydantic).

---

## 10. Database Schema

### PostgreSQL (core)
```sql
users(id, phone, email, name, lang, role, region, created_at)
profiles(user_id, degree_level_sought, field_isced, gpa, gpa_scale, national_exam_score,
         english_test, english_score, work_years, financial_need, gender, dob, interests jsonb)
scholarships(id, title, provider, country, level[], fields[], funding_type, amount,
             eligibility jsonb, deadline, open_date, url, source, lang, status, embedding_id)
matches(user_id, scholarship_id, probability, why jsonb, missing jsonb, computed_at)
applications(id, user_id, scholarship_id, stage, notes, submitted_at)
cvs(id, user_id, target_scholarship_id, template, lang, data jsonb, ats_score, version, pdf_url)
essays(id, user_id, scholarship_id, prompt, content, feedback jsonb, score, version)
documents(id, user_id, type, file_url, ocr_text, quality jsonb, verified bool)
reminders(id, user_id, scholarship_id, channel, remind_at, sent bool)
chat_sessions(id, user_id, lang) / chat_messages(id, session_id, role, content, tools jsonb)
interview_sessions(id, user_id, scholarship_id, transcript jsonb, feedback jsonb, score)
ingestion_queue(id, raw_url, extracted jsonb, confidence, reviewer_id, status)
```

### Qdrant collections
- `scholarships_v1` (1536-dim), payload: level, country, fields, deadline
- `profiles_v1`
- `knowledge_base` (visa, MoE, IELTS docs) for RAG

### Redis
- Sessions, rate limits, job status, semantic cache.

---

## 11. API Specification (REST + WebSocket)

```
POST   /v1/auth/otp/request          { phone }
POST   /v1/auth/otp/verify           { phone, code } → { accessToken, refreshToken }
GET    /v1/me                        → profile
PUT    /v1/me/profile

GET    /v1/scholarships?level=&country=&field=&deadlineAfter=&q=
GET    /v1/scholarships/{id}
GET    /v1/matches                   → ranked matches
POST   /v1/matches/recompute

POST   /v1/cv                        { mode: form|chat|upload, data|fileId } → 202 jobId
GET    /v1/cv/{id}
POST   /v1/cv/{id}/enhance           { section }
POST   /v1/cv/{id}/target            { scholarshipId }
GET    /v1/cv/{id}/score
POST   /v1/cv/{id}/export            { format: pdf|docx, template }

POST   /v1/essays                    { scholarshipId, prompt, content }
POST   /v1/essays/{id}/feedback
POST   /v1/documents/upload-url      → presigned S3 URL
POST   /v1/documents/{id}/ocr
GET    /v1/documents/checklist/{scholarshipId}

POST   /v1/chat/sessions
WS     /v1/chat/sessions/{id}/stream
POST   /v1/interview/sessions        { scholarshipId, mode }
WS     /v1/interview/{id}/audio

POST   /v1/reminders
GET    /v1/jobs/{jobId}
```
- OpenAPI 3.1 auto-generated from FastAPI; SDKs generated for Flutter & TS.

---

## 12. AI Pipelines & Prompt Engineering

### CV Bullet Enhancer Prompt (sketch)
```
System: You are an expert scholarship CV writer. Rewrite each bullet using the STAR
method, start with a strong action verb, quantify impact where the input supports it,
and NEVER invent facts. If a number is missing, ask a clarifying question instead.
Output JSON: { "bullets": [...], "questions": [...] }
Target scholarship priorities: {{criteria}}
Language: {{lang}}
```

### Evaluation
- Golden dataset of 500 Ethiopian student CVs (anonymized, consented).
- Metrics: hallucination rate (< 1%), rubric alignment, human preference (A/B).
- Regression tests in CI with `promptfoo`.

### Fine-tuning plan
- Phase 2: fine-tune a small open model (Llama-3-8B / Gemma) on Amharic scholarship Q&A for offline/low-cost inference.

---

## 13. Security, Privacy & Compliance

- Data minimization; passports/IDs encrypted at rest (AES-256), access-logged.
- PII redaction before sending to third-party LLMs; option to use local model only.
- Ethiopia Personal Data Protection Proclamation (2024) + GDPR-style rights: export, delete.
- OTP brute-force protection, JWT rotation, RBAC (student, counselor, admin, reviewer).
- Content safety: no fake documents; honesty guard in CV/essay tools.
- Audit logs for admin actions.

---

## 14. Infrastructure & DevOps

- **Containers:** Docker; **Orchestration:** Kubernetes (or Docker Compose for MVP).
- **Hosting:** Hetzner/Fly.io (cost) + Cloudflare CDN/WAF; edge caching for African PoPs.
- **CI/CD:** GitHub Actions → lint, test, build, deploy; preview envs per PR.
- **Monitoring:** Prometheus + Grafana, Sentry, Langfuse (LLM), Uptime Kuma.
- **Backups:** daily Postgres snapshots, S3 versioning.
- **Cost controls:** token budgets per user tier, semantic cache, batch inference at night.

---

## 15. Offline-First & Low-Bandwidth Strategy

- PWA + Flutter local DB; background sync.
- Text-first UI; images lazy-loaded and optional.
- CV preview as compressed images on mobile.
- Telegram and SMS as zero-install channels.
- Regional language content cached on device.

---

## 16. Monetization & Sustainability

| Tier | Price | Includes |
|------|-------|----------|
| Free | 0 ETB | Matching, 1 CV, 3 essay feedbacks/month, reminders |
| Plus | ~150 ETB/mo | Unlimited CVs/essays, interview sim, priority AI |
| School | per-seat | Counselor dashboard, bulk reports |
| Partners | B2B | Universities/NGOs sponsor free seats; verification API |

Payments: Telebirr, CBE Birr, Chapa, M-Pesa Ethiopia.

---

## 17. Roadmap

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| **MVP** | 0–3 months | Web + Telegram bot, scraper for 20 sources, matching, CV Maker (form + Europass), reminders |
| **V1** | 3–6 months | Flutter app, chat assistant (AM/EN), essay coach, document vault + OCR |
| **V2** | 6–12 months | Interview simulator, counselor dashboard, payments, Afaan Oromo/Tigrinya |
| **V3** | 12+ months | Fine-tuned local model, offline AI, partner university APIs, expansion to East Africa |

---

## 18. Repository Structure (Monorepo)

```
scholarai-ethiopia/
├── apps/
│   ├── web/                 # Next.js
│   ├── mobile/              # Flutter
│   ├── telegram-bot/        # aiogram
│   └── admin/               # Next.js admin
├── services/
│   ├── api/                 # FastAPI core (auth, users, catalog, applications)
│   ├── ai/
│   │   ├── cv_maker/
│   │   ├── matcher/
│   │   ├── essay_coach/
│   │   ├── chat_agent/
│   │   ├── doc_intel/
│   │   └── interview/
│   ├── notifications/
│   └── ingestion/           # Airflow DAGs, scrapers
├── packages/
│   ├── ui/                  # shared design system (React)
│   ├── schemas/             # CVSchema, Scholarship schema (JSON Schema → TS/Dart/Pydantic)
│   └── sdk/                 # generated API clients
├── infra/                   # Docker, k8s, Terraform
├── docs/                    # this design, ADRs
└── .github/workflows/
```

---

*ScholarAI Ethiopia — built so that no talented Ethiopian student misses an opportunity because information was hard to find.* 🇪🇹
