## Why

`register(name)` calls `watch(name)`, whose function form subscribes the **host component** to that field. A form that registers N fields therefore re-renders all N on every keystroke in any field — exactly the cost RHF's uncontrolled model exists to avoid. Real consumers fall back to `<Controller>` dozens of times per file solely to isolate the subscription via `useController`, which `register` cannot do. This is the single highest-impact change: it removes the reason to reach for `<Controller>` at all.

## What Changes

- Add **`useMuiField(name, options?)`** — a hook backed by RHF's `useController` that returns the same MUI prop shape as `register` (`value`/`checked`, `onChange`, `onBlur`, `error`, `helperText`, `inputRef`, `name`), but subscribes in isolation so re-renders are scoped to the field's own component.
- Add **`<MuiField name render={(props) => ...} />`** — a thin component that calls `useMuiField` internally and exposes the props via a render prop (children-as-function also supported). Because it is its own component, it re-renders alone — the drop-in `<Controller>` replacement for the convert/isolate use case.
- Preserve feature parity with `register`: the `type: "checkbox"` and `transform: { input, output }` options work identically on the new primitive.
- Keep `register` unchanged for small forms; **document** that it is controlled-via-`watch` and re-renders the host on every change, with a pointer to `useMuiField`/`<MuiField>` for forms that need isolation.

## Capabilities

### New Capabilities
- `mui-field-isolation`: an isolated, field-level subscription primitive (`useMuiField` hook + `<MuiField>` component) backed by `useController`, returning the MUI prop shape so each field re-renders independently and supports `type: "checkbox"` and `transform`.

### Modified Capabilities
<!-- None: register's runtime behavior is unchanged; only its documentation gains a scaling note, which is not a spec-level requirement change. -->

## Impact

- **`core/src/index.tsx`**: new `useMuiField` hook and `<MuiField>` component; shared extraction of the prop-mapping logic currently inside `register` (value/checked resolution, `transform` input/output, conditional `error`/`helperText`) so both `register` and `useMuiField` use one implementation. New public exports.
- **Public API / types**: new exports (`useMuiField`, `MuiField`, and their prop/return types). Additive, non-breaking.
- **Docs** (`docs-app`): document the new primitive, when to use it vs `register`, and add the scaling note to the `register` docs.
- **Dependencies**: none added — `useController` ships with the existing `react-hook-form` peer.
