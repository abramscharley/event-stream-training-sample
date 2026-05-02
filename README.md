# Event Stream Processor Training Sample

Synthetic demo codebase for AI-assisted development training with Cursor.

This project mirrors a simplified cybersecurity data pipeline:

1. Ingest raw source events, such as AWS-style security logs.
2. Map source-specific fields into normalized schemas.
3. Validate transformed events.
4. Preview mappings and validation results in a small React frontend.

This repo is intentionally small, safe, and synthetic. It contains no customer data.

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

1. Ask Cursor: `Explain this codebase like I am onboarding to the team.`
2. Ask Cursor: `Trace how an AWS event becomes a normalized ECS event.`
3. Ask Cursor: `Add support for sourceIPAddress -> source.ip and write a test.`
4. Ask Cursor: `Update the frontend so validation errors are easier to review.`
5. Ask Cursor: `Review this change for schema compatibility and possible edge cases.`

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

