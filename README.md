# FieldDesk Full-Stack Engineering Assessment

This practical assessment is conducted by **Gatlier** to evaluate full-stack engineering ability, with particular emphasis on backend correctness, security, database design, testing and production awareness.

FieldDesk is a fictional field-service application created solely for this assessment. Candidates are expected to build a working application, explain their technical decisions and take ownership of everything they submit.

## Start here

1. Read the complete [assessment brief](docs/ASSESSMENT.md).
2. Review the [evaluation criteria](docs/EVALUATION.md).
3. Follow the [submission instructions](docs/SUBMISSION.md).
4. Complete the [technical notes](candidate-submission/TECHNICAL_NOTES.md) and [AI usage disclosure](candidate-submission/AI_USAGE.md).
5. Raise questions or blockers through a GitHub Issue in this repository.

## Current milestone: monorepo foundation

The workspace currently contains a Next.js starter frontend and a NestJS starter
API. The worker, database, Redis, Docker Compose, authentication, and business
features are deferred. This is not the complete assessment implementation.

### Local setup

Use Node.js **22.23.1** (recorded in `.nvmrc`) and pnpm **10.34.6** (recorded in
the root `packageManager` field). Install pnpm with:

```sh
npm install --global pnpm@10.34.6
pnpm install --frozen-lockfile
pnpm dev
```

The frontend runs at <http://localhost:3000> and the API at
<http://localhost:3001>. The API starter responds to `GET /` with `Hello World!`.
No environment files or external services are needed for this milestone.
The API reads `PORT` from the process environment, defaulting to `3001`.
For example, in PowerShell: `$env:PORT = '3002'; pnpm dev:api`.

| Command                              | Purpose                                          |
| ------------------------------------ | ------------------------------------------------ |
| `pnpm dev`                           | Start both apps in watch mode                    |
| `pnpm dev:web` / `pnpm dev:api`      | Start a single app                               |
| `pnpm build`                         | Build all apps                                   |
| `pnpm start`                         | Start both apps after building                   |
| `pnpm --filter @fielddesk/web start` | Start the built frontend alone                   |
| `pnpm --filter @fielddesk/api start` | Start the built API alone                        |
| `pnpm lint` / `pnpm lint:fix`        | Check lint rules / apply fixes                   |
| `pnpm typecheck`                     | Generate Next.js route types and check app types |
| `pnpm format:check` / `pnpm format`  | Check formatting / apply formatting              |
| `pnpm test`                          | Run API starter unit and HTTP smoke tests        |

### Workspace standards

```text
apps/api/                    NestJS HTTP application
apps/web/                    Next.js App Router application
packages/typescript-config/  Shared strict compiler presets
packages/eslint-config/      Shared lint rules and framework presets
```

Apps own their runtime dependencies and do not import one another. Shared
configuration is consumed through `workspace:*` dependencies. Keep a single
root lockfile and package-manager declaration; run installations from the root.

Turborepo coordinates commands and caches build output. Development and production
servers are persistent and uncached. Build hashes include app environment files
and `NEXT_PUBLIC_*` variables. `PORT` is passed through to API runtime tasks.
Add future environment variables explicitly to the applicable Turbo task.

TypeScript is strict, with separate frontend and backend compiler presets.
ESLint checks are read-only; formatting uses root Prettier settings and LF line
endings. Generated files and build artifacts are excluded. GitHub CI runs frozen
installation, formatting, lint, type checks, API smoke tests, and builds on pull
requests and pushes to `main` and `assessment/arshadakl`.

See [the setup decision](docs/decisions/001-monorepo-foundation.md) for boundaries
and deferred work.

## Required assessment stack

- React or Next.js with TypeScript
- Node.js with TypeScript
- PostgreSQL
- Redis with a suitable job queue
- Docker Compose

Libraries and architectural patterns are the candidate's choice. Significant decisions and trade-offs should be documented.

## What to submit

- A working frontend, API and background worker
- Database migrations and seed data
- Automated tests
- Docker-based local setup
- Clear technical documentation
- Completed submission templates
- A pull request from the candidate's fork
- A 10–15 minute screen recording
- The final commit SHA

AI-assisted development tools are permitted. Every use must be disclosed clearly, including the tools used, the files or sections affected, the purpose of the assistance and how the output was verified. The candidate remains responsible for the correctness, security and maintainability of all submitted work.

There is no prescribed visual design. A clear, usable interface is sufficient; engineering quality is the main consideration.

## Communication

Use GitHub Issues for all assessment questions, assumptions and technical blockers. This keeps clarifications visible and ensures every candidate receives consistent information.

Please do not include confidential information, credentials or code from a current or previous employer.

---

**Conducted by Gatlier**
