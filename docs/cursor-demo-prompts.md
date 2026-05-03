# Cursor Demo Prompts

Use these prompts in order during the training session.

## 1. Repo intro prompt
```text
Explain this codebase like I am a new engineer joining the team.
Focus on the end-to-end flow from raw event to frontend display.
List the 5-8 most important files and what each one does.
Keep it concise and practical.
```

## 2. Rule setup instructions
Use a `Project Rule` here because this guidance is specific to the repo and should travel with it.

1. In Cursor, open `Rules`.
2. Click `+ New`.
3. Choose `Project Rule`.
4. New Rule: `training-sample-guidance` (Rule #1).
5. Paste this rule content.

If you need to add another rule later, do it in the same place (New Rule):
open `Rules` -> click `+ New` -> choose `Project Rule` again (or edit `training-sample-guidance` if you truly want to change that rule). Avoid re-copying the entire block into a fresh rule every time.

```mdc
---
description: Keep mapping changes synchronized across config, schema, tests, and demo UI
alwaysApply: true
---

# Mapping Change Workflow

When a change adds, removes, or renames a normalized field in this repo:

1. Update the mapping in `mappings/aws-to-ecs.yaml`.
2. Check whether the field must also be added to or removed from `schemas/ecs-required-fields.json`.
3. Update `tests/test_mapping.py` so the mapping behavior is explicitly verified.
4. If the frontend displays the affected field or validation output, update `frontend/src/App.jsx`.
5. Do not stop after editing only the mapping file if schema, tests, or demo UI would now be inconsistent.

## Verification

1. Run `python -m pytest ../tests` from `backend/`.
2. If frontend behavior changed, run `npm run build` from `frontend/`.

This rule exists because mapping changes in this repo are usually cross-file changes, and it is easy to make an incomplete update if you only edit the mapping config.
```

Why this is a good example:
- It is specific to the repo.
- It captures a repeated source of incomplete changes.
- It tells Cursor what “done” looks like.
- The same pattern generalizes to real repos: “if you change X, also update Y/Z and run these checks.”

## 3. Plan mode prompt
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

## 4. Agent mode prompt
```text
Implement the planned feature.
Add `cloud.account.id` to the normalized event by mapping it from `userIdentity.accountId`, make it a required schema field, update the test, and add a small frontend summary section that shows `user.name`, `source.ip`, and `cloud.account.id`.
Constraints:
- Keep the implementation simple and readable for training.
- Only edit the minimum necessary files.
- Do not refactor unrelated code.
- After making changes, run the relevant test/build checks and summarize the results.
```

## 5. Verification prompt
```text
Show me how you verified this change.
Run the relevant checks and summarize:
- which tests or builds you ran
- whether they passed or failed
- any risks or gaps that still remain
Keep it brief.
```

## 6. File inventory prompt
```text
List every file you changed for this feature.
For each file, give me one sentence on why it was touched.
Also tell me whether any files were intentionally left unchanged.
```

## 7. Review prompt
```text
Review this change like a skeptical teammate.
Look for bugs, edge cases, unclear naming, accidental scope creep, and missing tests.
List findings first, ordered by severity.
Then give a short summary of whether this is ready for review.
```

## 8. Summary prompt
```text
Summarize what changed in plain English for the team.
Explain the feature, the files touched, how it was verified, and why the change is reasonably safe.
Keep it short enough that I can read it aloud.
```

## Optional: Skill demo
Use this to show how to create a reusable project skill for similar repos.

1. Open `Skills`.
2. Click `+ New`.
3. Cursor opens a new agent with `/create-skill Help me create this skill for Cursor:`.
4. Paste this after the starter text:

```text
Create a project skill named `event-mapping-change`.
Use it when a user is adding or reviewing field mappings in event-processing repos that normalize source events into a target schema.
The skill should tell Cursor to:
- trace the affected field through sample data, mapping config, transform logic, schema, tests, and frontend
- prefer small synchronized changes
- avoid broad refactors unless the user asks
- run `python -m pytest ../tests` from `backend/`
- run `npm run build` from `frontend/` if UI changed
- report changed files and remaining risks
```

After it exists, users can invoke it with `/event-mapping-change`, and Cursor can also call it when relevant.
The `/create-skill` flow will save the new skill for you (no extra “store” instruction needed in the paste block).

## Optional: Verification Workflow Skills
If you want trainees to run the “checks” as reusable one-liners (instead of copying prompts), create a few small skills:

1. Skill #1: Verify the change (`/verify-change`)
2. Skill #2: Inventory changed files (`/inventory-changes`)
3. Skill #3: Ask for self-review (`/self-review`)
4. Skill #4: Close with summary (`/close-summary`)

Where to create them (matches the `Rules, Skills, Subagents` panel in Cursor):
1. Open the left sidebar and go to `Rules, Skills, Subagents`.
2. Under the `Skills` section, click `+ New`.
3. Choose `Project Skill`.
4. Name it (example): `verify-change` / `inventory-changes` / `self-review` / `close-summary`.
5. Paste the prompt text below.

How to use them (recommended modes):
- Skills are invoked from chat with the `/skill-name` prefix, and they run in the context of your current conversation/agent.
- Recommended training flow:
  - Understand the repo: `Ask Mode`
  - Plan the feature: `Plan Mode`
  - Implement the feature: `Agent Mode`
  - Then run the checks using skills in `Agent Mode` (so the model has access to the diff/context):
    1. `/verify-change`
    2. `/inventory-changes`
    3. `/self-review`
    4. `/close-summary`
  - If you specifically prefer a more “question/response” feel for `/verify-change`, you can run it in `Ask Mode`, but `Agent Mode` is fine for all four skills.

### Skill #1: Verify the change (`/verify-change`)
```text
Show me how you verified this change.
Run the relevant checks and summarize which tests or builds you ran, whether they passed or failed, and any risks or gaps that still remain.
Keep it brief.
```

### Skill #2: Inventory changed files (`/inventory-changes`)
```text
List every file you changed for this feature.
For each file, give me one sentence on why it was touched.
Also tell me whether any files were intentionally left unchanged.
```

### Skill #3: Ask for self-review (`/self-review`)
```text
Review this change like a skeptical teammate.
Look for bugs, edge cases, unclear naming, accidental scope creep, and missing tests.
List findings first, ordered by severity.
Then give a short summary of whether this is ready for review.
```

### Skill #4: Close with summary (`/close-summary`)
```text
Summarize what changed in plain English for the team.
Explain the feature, the files touched, how it was verified, and why the change is reasonably safe.
Keep it short enough that I can read it aloud.
```

Notes on “best place” (skills vs subagents vs commands):
- These four checks are LLM output-oriented, so skills are a good fit.
- Running `pytest` / `npm run build` is “command-oriented” work, so keep the existing `Optional: Command demo` as the canonical place to show the exact commands.

## Optional: Subagent demo
Paste:

```text
Use two explore subagents in parallel.
One should trace the backend flow from `sample-data/aws-cloudtrail-login.json` through `mappings/aws-to-ecs.yaml`, `backend/src/mapper.py`, `backend/src/validator.py`, `backend/src/server.py`, and `/api/demo`.
The other should trace how `frontend/src/App.jsx` fetches and displays that data.
Return the key files and a short summary of each flow, then synthesize the results for me.
```

## Optional: Command demo
1. Open a terminal in `backend/` and run `python -m pytest ../tests`.
2. If you changed the frontend, open a terminal in `frontend/` and run `npm run build`.
3. Then paste:

```text
Summarize the verification results from the commands I just ran.
Tell me what passed, what failed, and any remaining risks or gaps for review.
```
