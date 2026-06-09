# Mysl — Product Requirements Doc

## Original Problem Statement
> Mysl is an AI companion for people with ADHD and chaotic minds. You open it when you need to work and it just sits with you — like having someone in the room so your brain actually starts. While you work you just talk out loud like you normally would, and Mysl listens in the background, pulls out your tasks and notes automatically, and syncs everything to your Notion without you touching anything. Over time it learns your patterns — when you focus best, what sends you into a spiral, what actually works for you — and gets smarter about helping. If you've lost four hours and the guilt is hitting, it helps you recover without judging you. It's free, it's always on, and it's built for the person who has tried every productivity app and failed.

> User follow-up: i want the full mvp and like we need to build an ai body doubler that talks to people and stores all the tasks they're working on and help organise. so you need to make a cute character which would talk to you while you work.

## User Choices
- Voice: OpenAI Whisper (whisper-1)
- LLM: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- Notion: mocked indicator only
- Auth: Both Emergent Google login + JWT email/password

## User Personas
1. **ADHD knowledge worker** — has tried Notion, Roam, Todoist; all abandoned. Wants something passive that doesn't shame.
2. **University student with chaotic schedule** — needs to capture thoughts during sessions, recover from lost time.
3. **Neurodivergent founder/creator** — talks through problems out loud, wants those thoughts saved automatically.

## Core Requirements (static)
1. A character (orb) that feels alive and non-judgmental
2. Voice-first capture (no manual note-taking required)
3. Auto-extracted tasks + notes from speech
4. Sessions history and pattern insights
5. Recovery mode (returns after long gap → no shame)
6. Always-free messaging in copy
7. Dark, soft, warm aesthetic — no "productivity app" energy

## v1 Implemented (Feb 2026)
### Backend (FastAPI + MongoDB + emergentintegrations)
- `/api/auth/register|login|logout|me` — JWT/session via bcrypt + Mongo `user_sessions`
- `/api/auth/google/session` — Emergent OAuth exchange
- `/api/sessions/start|end|list|get` — focus session lifecycle, auto-companion intro line
- `/api/voice/transcribe` — multipart audio → Whisper → Claude extraction → tasks/notes/companion reply persisted
- `/api/tasks` and `/api/notes` CRUD
- `/api/companion/chat` — explicit text chat with Mysl
- `/api/insights` — best_hour, best_day, totals
- `/api/recovery/check` — non-judgmental welcome-back message if last session > 4h ago
- `/api/notion/status` — mocked sync indicator

### Frontend (React + Tailwind + framer-motion)
- Landing page (`/`) — orb, "someone in the room, so your brain starts." with CTAs
- Login (`/login`) — Google + email/password (toggle to signup)
- AuthCallback — handles `#session_id=` from Emergent OAuth
- Workspace (`/workspace`) — 3-column: transcript+chat / orb+voice / tasks+notes
- Sessions (`/sessions`) — history list + detail modal
- Insights (`/insights`) — stats + pattern card
- Companion orb (`framer-motion` breathing/listening/speaking/thinking)
- Voice bar with live waveform meter
- Recovery modal (full-screen welcome back)
- Notion sync pill (mocked)

## P1 Backlog (deferred)
- Real-time auto-chunking during long recordings (currently push-to-talk)
- Real Notion sync (token + DB id)
- Adaptive companion personality (warmer over time)
- Mobile-optimised layout
- Export tasks (CSV / share link)
- "Companion mode" idle screen (no session) — orb just hangs out
- Email reminders to come back

## P2 Backlog
- Tone customization (extra warm / dry / minimalist)
- Multi-language transcription
- Browser extension to capture from any tab
- Shared sessions ("body double with a friend")

## Next Actions
- Validate microphone capture end-to-end with real audio
- Add waitlist/early-access landing flow if user wants top-of-funnel growth
- Plug in real Notion when user provides token
