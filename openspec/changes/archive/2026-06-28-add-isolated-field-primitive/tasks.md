## 1. Refactor: extract shared prop mapping

- [x] 1.1 Extract the value/checked resolution, `transform.input/output`, `""` fallback, and conditional `error`/`helperText` out of `register` into one internal helper (e.g. `buildFieldProps`) that takes the raw pieces (current value, error, isCheckbox, transform, name, blur/change wiring) and returns the MUI props
- [x] 1.2 Rewire `register` to call the shared helper; confirm its observable output is unchanged (same props, same `type`/`transform`/error behavior)
- [x] 1.3 `cd core && bun run build` passes and the emitted `register` overloads in `dist/index.d.ts` are unchanged

## 2. Implement useMuiField hook

- [x] 2.1 Add `useMuiField(name, options?)` backed by `useController({ name, control })`, deriving value/error from `field`/`fieldState` and reusing `buildFieldProps`
- [x] 2.2 Give `useMuiField` the same overload set as `register` (`{ type: "checkbox" }` → boolean shape; `{ transform }` → component-typed value; otherwise conditional value shape) using the existing `MuiRegisterOptions`/`MuiTransform`/`RegisterMuiReturn*` types
- [x] 2.3 Source `control` from `useFormContext` (or accept it via the hook) so `useMuiField` works inside a `MuiFormProvider`

## 3. Implement MuiField component

- [x] 3.1 Add `<MuiField name options render={(props) => ReactNode} />` that calls `useMuiField` and passes props to `render` (and supports a function `children`)
- [x] 3.2 Type `MuiField`'s props/return so `render` receives the correct shape per options (checkbox/transform/value)

## 4. Exports & types

- [x] 4.1 Export `useMuiField`, `MuiField`, and their option/return/prop types from `core/src/index.tsx`
- [x] 4.2 `cd core && bun run build` passes; new exports appear in `dist/index.d.ts`

## 5. Verify behavior & types

- [x] 5.1 Type-level check: `useMuiField`/`MuiField` infer `value` as component type with `transform`, `checked` with `type: "checkbox"`, and `value | ""` otherwise (mirror the register contract check)
- [x] 5.2 Confirm isolation in the live demo: render fields via `<MuiField>`/`useMuiField`, type in one, observe only that field re-renders (e.g. render-count log or React DevTools) while the host and siblings do not
- [x] 5.3 `docs-app` typechecks (`bunx tsc --noEmit`); demo `App.tsx` compiles

## 6. Docs

- [x] 6.1 Add a docs section for `useMuiField` and `<MuiField>` (when to use vs `register`, examples incl. checkbox + transform)
- [x] 6.2 Add the scaling note to the `register` docs (controlled-via-`watch`, re-renders host) with a pointer to the isolated primitive
- [x] 6.3 Update `llms.txt` API summary with the new exports
