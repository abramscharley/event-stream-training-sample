# Cursor Demo Prompts

## 1. Onboarding prompt
Explain this repository like I am joining the development team. Focus on the lifecycle of a raw cybersecurity event as it becomes a normalized event.

## 2. Trace prompt
Trace how sourceIPAddress from the AWS sample event becomes source.ip in the normalized ECS-style event. List the files involved.

## 3. Guardrailed implementation prompt
Add support for mapping userIdentity.accountId to cloud.account.id. Only modify the mapping file and the mapping test. Do not change validation behavior yet. Explain your plan before editing.

## 4. Validation prompt
Add cloud.account.id as an optional string field in the schema validation file. Then add one test that confirms the mapped value is present.

## 5. Frontend prompt
Update the frontend mapping table to visually flag missing sample values. Do not change the mapping list or raw event data.

## 6. Review prompt
Review the changes for schema compatibility, test coverage, and risks caused by overly broad edits. Return findings before suggesting code.
