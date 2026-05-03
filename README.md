# Event Stream Processor Training Sample

Synthetic demo codebase for AI-assisted development training with Cursor.

This project mirrors a simplified cybersecurity data pipeline:

1. Ingest raw source events (synthetic demo input), such as AWS-style security logs.
2. Map source-specific fields into normalized schemas (real mapping logic).
3. Validate transformed events (real validation logic).
4. Preview mappings and validation results in a small React frontend (real UI rendering, using the demo backend payload).

This repo is intentionally small, safe, and synthetic. It contains no customer data.

For a simple instructor runbook, see `docs/simple-cursor-lesson-plan.md`.
For copy/paste prompts, see `docs/cursor-demo-prompts.md`.

## Training Goals

Use this codebase to demonstrate:

- Asking Cursor to explain unfamiliar code.
- Finding relevant files in a repo.
- Adding a new field mapping.
- Adding validation checks.
- Updating frontend display logic.
- Writing tests for schema transformations.
- Using guardrails so Cursor does not modify unrelated files.

## Suggested Demo Flow

1. Ask Cursor to explain the codebase and trace the raw event through the app.
2. Switch to Plan mode and plan a small feature with clear constraints.
3. Switch to Agent mode and implement `userIdentity.accountId -> cloud.account.id`.
4. Ask Cursor to run verification steps and summarize the results.
5. Ask Cursor to list touched files and perform a skeptical self-review.

## Run Backend Tests

```bash
cd backend
python -m pytest ../tests
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Local Ports
- Frontend (Vite/React): http://localhost:5173
- Backend API (Python): http://localhost:8000
  - Health: http://localhost:8000/health
  - Demo payload: http://localhost:8000/api/demo

## Run Backend (API)
```bash
cd backend
python src\server.py
```

## Testing via Frontend Buttons (Alternate)
When you open the frontend in the browser, it calls the demo API (`/api/demo`).

If the Python backend is not running, the frontend will start it automatically (via the dev-server middleware) and then render results.

On the page (Buttons):
- `Run demo (starts backend)`: starts the backend if needed and re-fetches `/api/demo`
- `Stop backend`: stops the backend started for testing

