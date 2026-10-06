# AI usage disclosure

AI-assisted development tools are permitted for this assessment. Their use does not reduce the score by itself. Transparency, independent verification and understanding of the submitted work are required.

List every AI tool used, including coding assistants, chat tools, code generators, design generators and automated review tools.

If no AI tool was used, write: **No AI-assisted tools were used for this submission.**

## Usage summary

| Tool and model, if known | Files, features or sections affected                                                                                           | Purpose of use                                         | Nature of the output                                                                                   | How it was verified                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| OpenAI Codex (GPT-6)     | Workspace manifests/configuration, apps/api, apps/web, shared config packages, CI, README, setup decision, and this disclosure | Plan and implement the initial NestJS/Next.js monorepo | Generated configuration and documentation; invoked official framework generators; adapted starter code | Local formatting, lint, type checks, two API smoke tests, production builds, HTTP startup checks, and fresh-copy frozen installation/type checks |

## Details

### Initial monorepo foundation — 2026-10-06

Codex inspected the assessment repository, the supplied FieldDesk plan, and the
LMS workspace structure, then implemented the user-approved foundation plan.
Nest CLI and create-next-app generated the starter applications. Codex added
pnpm/Turbo wiring, shared strict TypeScript and ESLint configuration, Prettier,
GitHub CI, and setup documentation.

The installed pnpm was deliberately upgraded from 9.15.4 to 10.34.6. The root
package-manager declaration pins that version, and CI reads the same declaration.
CI includes pushes to the assessment branch as well as main and pull requests.

Generated app-local workspace/formatting files were removed in favour of root
standards. The Next.js demo and Google fonts were replaced with a minimal
FieldDesk page and system fonts. NestJS defaults to port 3001. Its incremental
build metadata was moved into dist after startup verification exposed stale
metadata following output deletion. Employer application code and integrations
were not copied.

Verification performed by the assistant:

- Frozen-lockfile installation succeeded in the workspace and in a fresh
  temporary copy without node_modules or build artifacts.
- Formatting, lint, type checks, API unit/HTTP smoke tests, and builds were run.
- Both development and production starter routes returned HTTP 200.
- Independent development commands succeeded, including the API PORT override.
- Fresh-copy type checks succeeded before its first build.

GitHub CI is configured but has not been run remotely. These assistant checks
do not certify the candidate's independent review or verification; candidate
confirmation boxes remain unchecked. No assessment business features were
implemented in this milestone.

## Candidate confirmation

Replace the unchecked boxes with checked boxes when true:

- [ ] I have disclosed all AI-assisted work in this submission.
- [ ] I personally reviewed every submitted file.
- [ ] I can explain and modify every part of the implementation.
- [ ] I independently ran the documented tests and checks.
- [ ] I did not submit confidential or proprietary third-party material.

Candidate name:

Date:
