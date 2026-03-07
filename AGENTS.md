# Repository Guidelines

## Project Structure & Module Organization
This repository is a Bun-powered Turborepo. App entry points live in `apps/`: `apps/app` (main product, port `3000`), `apps/api` (API/webhooks, `3001`), `apps/web` (marketing/docs, `3002`), and `apps/adf-validator` (`3003`). Shared code lives in `packages/`, especially `packages/backend` (Drizzle, Better Auth, Supabase), `packages/design-system`, `packages/editor`, `packages/lib`, and `packages/atlassian`. Keep reusable logic in packages, and keep app-specific routes, UI, and actions inside the relevant app. Ignore generated output such as `.next/` and `.turbo/`.

## Build, Test, and Development Commands
- `bun install` — install workspace dependencies.
- `bun run dev` — start all apps through Turbo.
- `bun run dev:app`, `bun run dev:api`, `bun run dev:web`, `bun run dev:core` — run targeted apps only.
- `bun run build` — build every workspace.
- `bun run type-check` — run TypeScript checks across the monorepo.
- `bun run check` — run `ultracite` plus `manypkg` workspace validation.
- `bun run fix` — apply auto-fixes from `ultracite`.
- `bun run migrate` — push Drizzle schema changes from `packages/backend`.

## Coding Style & Naming Conventions
Use TypeScript and React throughout. Formatting and linting are driven by `biome.jsonc` with the `ultracite` presets; run `bun run check` before opening a PR. Follow the existing style: 2-space indentation, single quotes, semicolons, and `type` aliases over interfaces when possible. Use PascalCase for React components, camelCase for functions and variables, and kebab-case for route files and many component filenames (for example `sign-in/page.tsx` and `avatar-tooltip.tsx`).

## Testing Guidelines
There is no dedicated automated test suite in the repo today. For changes, treat `bun run type-check` and `bun run check` as the minimum validation gate. When touching database code, verify Drizzle commands in `packages/backend`; when changing UI, run the affected app locally and capture screenshots for visual regressions.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit-style prefixes such as `fix:`, `refactor:`, `chore:`, and `docs:`. Keep commit subjects short and imperative, e.g. `fix: unblock next app navigation`. PRs should include a brief summary, linked issue or context, the commands you ran to validate, and screenshots or recordings for UI changes.

## Security & Configuration Tips
Copy values from `.env.example` and keep secrets in local `.env` files or Vercel environment variables only. Never commit credentials, Supabase keys, or auth secrets. Review integrations carefully when editing webhook routes, auth flows, or database schema code.
