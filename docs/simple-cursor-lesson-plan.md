# Simple Cursor Lesson Plan

## Goal
Use this repo to teach a low-risk, practical Cursor workflow:

1. Understand an unfamiliar codebase.
2. Add lightweight project guidance with a rule.
3. Plan a small feature with guardrails.
4. Implement it in Agent mode.
5. Verify with tests and build output.
6. Review what changed before trusting it.

## Opening Script
Read this aloud at the start:

> This sample app is a tiny event-processing pipeline. The backend loads a raw AWS-style security event, applies a mapping to convert it into a normalized schema, validates the result, and exposes that data through a local API. The frontend calls that API and shows the raw event, the mapped output, and any validation issues. We are using it as a safe sandbox for learning Cursor workflows, not as a production architecture example.

## Key Files To Show
- `README.md`: repo purpose and basic run instructions.
- `sample-data/aws-cloudtrail-login.json`: raw input event.
- `mappings/aws-to-ecs.yaml`: source-to-target field mappings.
- `backend/src/mapper.py`: mapping and constant application logic.
- `backend/src/validator.py`: required-field and type validation.
- `backend/src/app.py`: load -> transform -> validate orchestration.
- `backend/src/server.py`: local API endpoint for the frontend.
- `frontend/src/App.jsx`: UI for raw data, mapped data, and validation status.
- `tests/test_mapping.py`: regression coverage for the mapping flow.

## Feature To Demo
Use one small feature that is real, visible, and safe:

Add `cloud.account.id` to the normalized event by mapping it from `userIdentity.accountId`, make it required by the schema, update the backend test, and add a small frontend summary section that shows `user.name`, `source.ip`, and `cloud.account.id`.

Why this works well:
- It is easy to explain.
- It touches config, test, and UI.
- It is small enough for a live session.
- It shows that Cursor should edit only the relevant files.

Expected files for this exercise:
- `mappings/aws-to-ecs.yaml`
- `schemas/ecs-required-fields.json`
- `tests/test_mapping.py`
- `frontend/src/App.jsx`

## Live Demo Flow

### Step 1: Understand The Repo
Paste:

```text
Explain this codebase like I am a new engineer joining the team.
Focus on the end-to-end flow from raw event to frontend display.
List the 5-8 most important files and what each one does.
Keep it concise and practical.
```

### Step 2: Add Project Guidance With A Rule
Use a `Project Rule` here because this guidance is specific to the repo and should be shared with anyone using it.

1. In Cursor, open `Rules`.
2. Click `+ New`.
3. Choose `Project Rule`.
4. Name it `training-sample-guidance`.
5. Paste this rule:

```mdc
---
description: Keep mapping changes synchronized across config, schema, tests, and demo UI
alwaysApply: true
---

# Mapping Change Workflow

When a change adds, removes, or renames a normalized field in this repo:

- Update the mapping in `mappings/aws-to-ecs.yaml`.
- Check whether the field must also be added to or removed from `schemas/ecs-required-fields.json`.
- Update `tests/test_mapping.py` so the mapping behavior is explicitly verified.
- If the frontend displays the affected field or validation output, update `frontend/src/App.jsx`.
- Do not stop after editing only the mapping file if schema, tests, or demo UI would now be inconsistent.

## Verification

- Run `python -m pytest ../tests` from `backend/`.
- If frontend behavior changed, run `npm run build` from `frontend/`.

This rule exists because mapping changes in this repo are usually cross-file changes, and it is easy to make an incomplete update if you only edit the mapping config.
```

Use this moment to explain:
- Rules are persistent project guidance.
- Good rules capture repo-specific workflow or correctness dependencies, not generic advice.
- A strong pattern users can reuse is: “if you change X, also update Y/Z and verify it this way.”

### Step 3: Plan Before Editing
Switch to Plan mode and paste:

```text
Plan a minimal feature for this sample app.
Add `cloud.account.id` to the normalized event by mapping it from `userIdentity.accountId`, make it required in the schema, update the test coverage, and add a small frontend summary section that shows `user.name`, `source.ip`, and `cloud.account.id`.
Constraints:
- Keep the change small and easy to explain in a live training.
- Touch only the files that are necessary.
- Do not change unrelated architecture or styling.
- Tell me exactly which files you expect to edit and why.
- Include how you will verify the change.
```

### Step 4: Implement In Agent Mode
Switch to Agent mode and paste:

```text
Implement the planned feature.
Add `cloud.account.id` to the normalized event by mapping it from `userIdentity.accountId`, make it a required schema field, update the test, and add a small frontend summary section that shows `user.name`, `source.ip`, and `cloud.account.id`.
Constraints:
- Keep the implementation simple and readable for training.
- Only edit the minimum necessary files.
- Do not refactor unrelated code.
- After making changes, run the relevant test/build checks and summarize the results.
```

### Step 5: Ask For Verification
Paste:

```text
Show me how you verified this change.
Run the relevant checks and summarize:
- which tests or builds you ran
- whether they passed or failed
- any risks or gaps that still remain
Keep it brief.
```

### Step 6: Ask For File Inventory
Paste:

```text
List every file you changed for this feature.
For each file, give me one sentence on why it was touched.
Also tell me whether any files were intentionally left unchanged.
```

### Step 7: Ask For A Self-Review
Paste:

```text
Review this change like a skeptical teammate.
Look for bugs, edge cases, unclear naming, accidental scope creep, and missing tests.
List findings first, ordered by severity.
Then give a short summary of whether this is ready for review.
```

### Step 8: Ask For A Human-Friendly Summary
Paste:

```text
Summarize what changed in plain English for the team.
Explain the feature, the files touched, how it was verified, and why the change is reasonably safe.
Keep it short enough that I can read it aloud.
```

## Copy/Paste Checklist
Use this sequence during class:

1. Explain the repo.
2. Create a lightweight project rule.
3. Plan the feature.
4. Implement the feature.
5. Verify the change.
6. Inventory changed files.
7. Review the change.
8. Summarize the result.

If you want the exact text, use `docs/cursor-demo-prompts.md`.

## Rules, Skills, Subagents, And Commands
Use this as a quick explanation slide or talking point:

- Rule:
  Use `Rules` -> `+ New` -> `Project Rule` for repo-specific guidance that should apply automatically on every prompt. Good rules cover non-obvious judgment calls, not generic advice.
- Skill:
  Use `Skills` -> `+ New`, which opens a new agent starting with `/create-skill Help me create this skill for Cursor:`. This is best for reusable workflows, such as consistent mapping-change updates across mapping, schema, tests, and UI.
- Subagent:
  Use a subagent when you want parallel exploration or broader research, such as tracing backend and frontend flow at the same time before planning a change.
- Command:
  Use terminal commands for repeatable verification steps like `python -m pytest ../tests` and `npm run build`, then ask Cursor to summarize the results.

Recommended examples for this repo:
- Rule: `training-sample-guidance` as a project rule that keeps mapping changes synchronized across mapping config, schema, tests, and demo UI.
- Skill: an `event-mapping-change` project skill created from the Skills UI for reusable mapping-change workflows.
- Subagent: two parallel `explore` subagents to trace backend flow and frontend display flow.
- Command: `python -m pytest ../tests` from `backend/`, plus `npm run build` from `frontend/` when UI changes.

## Teaching Points To Say Out Loud
- We are not asking Cursor to do everything. We are giving it a small task with constraints.
- We plan first when we want to control scope.
- We still verify with tests and build output.
- We still review the changed files before trusting the result.
- The goal is not more code. The goal is faster understanding and safer iteration.

## Fallback Shorter Exercise
If time runs short, use a smaller feature:

- Add `user.id` from `userIdentity.principalId`.
- Make it required in `schemas/ecs-required-fields.json`.
- Update `tests/test_mapping.py`.
- Skip the frontend UI change.

That version still demonstrates planning, implementation, verification, and review with less typing.
