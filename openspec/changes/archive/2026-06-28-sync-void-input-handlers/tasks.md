## 1. Make handlers synchronous

- [x] 1.1 In `core/src/index.tsx`, change `wrappedOnChange` from `async (event)` to `(event)` and remove its trailing `return true;`.
- [x] 1.2 Change `wrappedOnBlur` from `async (event)` to `(event)` and remove its trailing `return true;`.

## 2. Verify

- [x] 2.1 `cd core && bun run build` — tsc passes clean.
- [x] 2.2 `bun run format` at repo root.
