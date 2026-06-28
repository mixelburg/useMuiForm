## Context

`wrappedOnChange` (core/src/index.tsx:68-86) and `wrappedOnBlur` (88-108) are declared `async` and each ends with `return true`. MUI never reads handler return values and nothing awaits the resulting promises, so the `Promise<boolean>` type is dead surface area that leaks into autocomplete.

## Goals / Non-Goals

**Goals:**
- `onChange`/`onBlur` typed as `(event) => void`.
- Zero runtime behavior change.

**Non-Goals:**
- Touching `trigger`/`setValue` async flows inside the handlers (they remain fire-and-forget exactly as today).
- Any change to the checkbox vs. value branching logic.

## Decisions

- Remove `async` and the trailing `return true` from both handlers. That's the whole change.
- Keep the inner `trigger(name)` call unawaited — it was never awaited and the handler signature staying `void` is the point.

## Risks / Trade-offs

- Type-level breaking change for any consumer that awaited or read the boolean return. Realistically none, since the values were undocumented noise; called out in proposal/release notes.
