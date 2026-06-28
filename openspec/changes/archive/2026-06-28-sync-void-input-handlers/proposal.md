## Why

The `onChange`/`onBlur` handlers returned by `register` are `async` and unconditionally `return true`, so their type is `(e) => Promise<boolean>`. MUI ignores handler return values and nothing awaits them — the `Promise` and the `boolean` are dead noise that leaks into the library's public types and consumers' autocomplete. Resolves GH issue #8.

## What Changes

- Make `wrappedOnChange` and `wrappedOnBlur` in `core/src/index.tsx` synchronous `void` handlers: drop `async` and the trailing `return true`.
- No runtime behavior change — the return values were never consumed.
- **BREAKING** (type-level): `register(...).onChange` / `.onBlur` change signature from `(e) => Promise<boolean>` to `(e) => void`. Source-compatible for normal usage; only consumers awaiting or reading the return value are affected.

## Capabilities

### New Capabilities
- `mui-field-registration`: the `register` adapter that wires RHF field state into MUI inputs, including the change/blur event handlers it returns.

### Modified Capabilities
<!-- none — no existing specs in openspec/specs/ -->

## Impact

- `core/src/index.tsx` (handler definitions ~lines 68–108).
- Public type surface of `usemuiform`'s `register` return value — call out as a (minor) breaking type change in release notes.
