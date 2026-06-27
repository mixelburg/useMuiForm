# Project Instructions

`useMuiForm` is a lightweight wrapper around [react-hook-form](https://react-hook-form.com/) that wires MUI inputs into RHF. Two workspaces:
- **`core/`** — the published library (`usemuiform` on npm). Source is `core/src/index.tsx`. Build: `cd core && bun run build` (tsc → `dist/`).
- **`docs-app/`** — Next.js + fumadocs documentation site. Dev: `cd docs-app && bun run dev` (port 3333). Build: `bun run build`.

## Workflow rules

- **Use `bun`** — not npm/yarn/pnpm. `bun` lives at `~/.bun/bin/` and is on PATH only in interactive shells. In tool-invoked Bash, plain `bun` may fail with "command not found"; prefix with `~/.bun/bin/bun` or prepend `PATH="$HOME/.bun/bin:$PATH"`.
- **Format/lint with Biome** — `bun run format` at the repo root (`biome check --write --unsafe`). Husky runs on commit. Run it before declaring a change done.
- **Verify before declaring done** — for `core/` changes, run `cd core && bun run build` (tsc must pass clean). For `docs-app/` changes, run `cd docs-app && bun run build`. Don't defer the build to the user — "compiles in my head" is not verification. There is no test suite; the typecheck/build IS the gate.
- **Surgical changes** — touch only what the task requires. Don't reformat or "improve" adjacent code in a feature/fix. Exception: clean up imports/vars your edit just orphaned.
- **Surface assumptions** — when a request is ambiguous, state the interpretation you're acting on in one line before doing the work. For genuinely ambiguous decisions, use `AskUserQuestion`.
- This library's API is its public surface — treat changes to `core/src/index.tsx` exports as breaking-change candidates and call them out.

## OpenSpec

This repo uses OpenSpec (`openspec/`, `.claude/commands/opsx/`). For non-trivial features/changes:
- Start with `/opsx:propose "idea"`; apply with `/opsx:apply`; archive with `/opsx:archive`.
- **Commit after every `/opsx:archive`** — stage the archived change folder + any `openspec/specs/` syncs and commit (e.g. `openspec: archive <slug>`). Don't ask first; skip only if there's nothing to commit.

## Serena MCP — symbol-aware code navigation

Serena is configured as an MCP server. Use it for code-structure tasks; vanilla grep/find is fine for ad-hoc text matches and config/markdown files.
- **At the start of a coding task, call `mcp__serena__initial_instructions` once** to load Serena's project contract.
- Symbol questions → Serena, not grep: "where defined" → `find_symbol`; "who calls" → `find_referencing_symbols`; "what's in this file" → `get_symbols_overview`; rename → `rename_symbol`; replace a function body → `replace_symbol_body`.
- Keep grep/Read for shell commands, MDX/config/JSON, and line-level edits.

## Subagents — when to delegate

Prefer a specific subagent type over `general-purpose`. Run independent agents in parallel (one message, multiple `Agent` blocks).
- **`Explore`** — cross-file code lookup that'd take 3+ grep/find calls. Read-only, cheap.
- **`Plan`** — design for non-trivial changes before writing code. Not for small tweaks.
- **`comprehensive-review:code-reviewer`** — diff review on high-blast-radius changes (public API of `core/`). Address P0/P1 before done.
- **`frontend-mobile-development:frontend-developer`** / **`javascript-typescript:typescript-pro`** — MUI/React component work and gnarly TS generics (this lib leans hard on RHF's generic types).

Stay in-line for: editing 1–3 files with clear instructions, running a known build/lint command, routine Read/Edit/Write.

## Infra Credentials (SOPS + age)

Secrets live encrypted-at-rest in `secrets/infra.enc.env` (committed) using [SOPS](https://github.com/getsops/sops) + an [age](https://github.com/FiloSottile/age) key. The encrypted file syncs via git; only the per-machine private age key is local. No daemon, no vault.
- **Current keys:** `GH_TOKEN`, `GITHUB_TOKEN` (the GitHub PAT, same value under both names so `gh`/git/CI pick it up).
- **Use a secret = wrap the command:** `sops exec-env secrets/infra.enc.env '<cmd>'` exports all keys for `<cmd>`. E.g. `sops exec-env secrets/infra.enc.env 'git push'` or `... 'gh pr create'`. Single value inline: `sops -d --extract '["GH_TOKEN"]' secrets/infra.enc.env`.
- **age private key** (auto-detected by sops, no env var): macOS → `~/Library/Application Support/sops/age/keys.txt`; Linux → `~/.config/sops/age/keys.txt`. `chmod 600`, never commit it. "no master key" / "no identity" = key missing or wrong path.
- **Onboard a machine/person:** `age-keygen -o <keyfile>`, add the printed `age1…` recipient to `.sops.yaml` under `age:`, then `sops updatekeys secrets/infra.enc.env` and commit. They drop their private key at the path above.
- **Add / rotate a secret:** `sops secrets/infra.enc.env` opens the decrypted file in `$EDITOR`; save to re-encrypt.
- Day-to-day pushes use SSH (`origin` is `git@github.com:…`), so the token isn't needed for those — it's here for HTTPS/`gh`/CI use.

## docs-app UI

The docs site uses MUI 7. For user-facing UI work there, invoke the matching `impeccable` skill during implementation and a `polish` pass before done. Make it work and look good on mobile (verify at 375px); touch targets ≥ 44×44px. Library/`core` changes that don't render UI are exempt.
