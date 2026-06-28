## Context

`register(name)` (in `core/src/index.tsx`) derives the controlled `value`/`checked` by calling `watch(name)`. The function form of `watch` subscribes the component that *calls* it — the host form — so every registered field re-renders on any field's change. RHF's own escape hatch is `<Controller>` / `useController`, which subscribe through a dedicated component and thus re-render only that field. Consumers reach for `<Controller>` purely to get this isolation, re-implementing the value↔MUI mapping by hand each time.

`register` already centralizes that mapping (checkbox detection, `transform.input/output`, conditional `error`/`helperText`, the `""` fallback, the dual event/raw `onChange`). The goal is to expose the same mapping through an isolated subscription, without forking the logic.

## Goals / Non-Goals

**Goals:**
- A field-level primitive whose re-renders are scoped to the field's own component.
- Identical output prop shape and semantics to `register` (so it's a drop-in per field), including `type: "checkbox"` and `transform`.
- Reuse `register`'s mapping logic — one implementation, two entry points.
- Additive and non-breaking; `register` keeps working unchanged.
- No new dependency (`useController` is part of the existing `react-hook-form` peer).

**Non-Goals:**
- Changing or deprecating `register`. It stays the easy path for small forms.
- Fixing the argless-`onBlur` (picker `onClose`) touched-state gap (tracked separately).
- Auto-isolating `register` itself (impossible without moving each field into its own component).

## Decisions

### Decision 1: `useController` as the isolation backend
Use RHF `useController({ name, control })` rather than `useWatch` + `register`. `useController` returns `field` (`value`, `onChange`, `onBlur`, `ref`) and `fieldState` (`error`) with a subscription scoped to the calling component, which is exactly the isolation we need and the same mechanism `<Controller>` uses. `useWatch` would give the value but not the wired handlers/field state, forcing us to re-derive them.

*Alternative considered:* keep `watch` but wrap each field — rejected, `watch` always subscribes the caller; only a separate component + `useController` isolates.

### Decision 2: Ship both a hook and a component
- `useMuiField(name, options?)` — the hook. Returns the same shape as `register(name, options)`. Callers who build their own field components use this directly.
- `<MuiField name options render={(props) => ReactNode} />` — a thin component that calls `useMuiField` and passes the props to a render prop (and `children` as a function). This is what delivers isolation inside an existing host component: React re-renders at component granularity, so the host stays put and only `<MuiField>` re-renders.

Rationale: the hook alone does **not** isolate the host that calls it — isolation requires a child component boundary. The component provides that boundary; the hook is the reusable core and the building block for custom field components.

*Alternative considered:* component-only — rejected, advanced users want the hook to compose their own field components without a render prop.

### Decision 3: Extract a shared `buildFieldProps` mapper
Pull the value/checked resolution, `transform` application, `""` fallback, and conditional `error`/`helperText` out of `register` into one internal helper that takes the raw pieces (current value, error, isCheckbox, transform) and returns the MUI props. `register` (value via `watch`) and `useMuiField` (value via `useController`) both call it. This guarantees the two primitives stay behaviorally identical and prevents drift.

### Decision 4: Mirror the `register` overloads
`useMuiField` (and `MuiField`'s props) carry the same overload set as `register`: `{ type: "checkbox" }` → boolean/`checked` shape; `{ transform: { input, output } }` → value typed as `input`'s return; otherwise the conditional value shape. Reuse the existing `MuiRegisterOptions`, `MuiTransform`, and `RegisterMuiReturn*` types so the contract is shared, not duplicated.

## Risks / Trade-offs

- **Render-prop verbosity** → `<MuiField>` requires a render callback; documented with copy-paste examples, and `useMuiField` is offered for those who prefer a hook in a custom component.
- **Two ways to do the same thing (register vs useMuiField)** → could confuse. Mitigation: docs give a one-line rule — `register` for small forms, `useMuiField`/`<MuiField>` when a form is large enough that per-keystroke re-renders matter.
- **Mapping extraction regression risk** → refactoring `register`'s internals could change behavior. Mitigation: the extraction is pure-function and covered by the existing `register` build/type contract plus new spec scenarios; `register`'s observable behavior must remain identical.
- **`onChange` raw vs event parity** → `useController`'s `field.onChange` differs from a DOM input's; the shared mapper already normalizes both the event and raw paths (as `register` does), so checkbox/transform/raw-picker flows behave the same.
