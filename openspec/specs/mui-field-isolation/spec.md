# mui-field-isolation

## Purpose

Provide a per-field isolation primitive so that value/error updates re-render only the component that owns a field, not the host form or sibling fields. The `useMuiField` hook (and the `<MuiField>` render-prop component) subscribe to a single field via react-hook-form's `useController`, offering the same prop shape and options as `register` while avoiding the host-level re-renders that `register`'s `watch`-based value derivation causes.

## Requirements

### Requirement: useMuiField subscribes to a single field in isolation

The library SHALL provide a `useMuiField(name, options?)` hook that subscribes to the named field via react-hook-form's `useController`, so that value/error updates re-render only the component that calls the hook — not the host form or sibling fields.

#### Scenario: typing in one field does not re-render siblings

- **WHEN** several fields are each rendered inside their own component via `useMuiField` (or `<MuiField>`)
- **AND** the user types in one of them
- **THEN** only that field's component re-renders
- **AND** the host form component and the other field components do not re-render

#### Scenario: value stays in sync with form state

- **WHEN** the form value for `name` changes via `reset`, `setValue`, or user input
- **THEN** the `value` (or `checked`) returned by `useMuiField(name)` reflects the new value

### Requirement: useMuiField returns the same prop shape as register

The props returned by `useMuiField` SHALL match those returned by `register` for the same field and options: `name`, `onChange`, `onBlur`, `inputRef`, and either `value` (non-boolean) or `checked` (checkbox), plus `error`/`helperText` only when the field has an error.

#### Scenario: spreads onto an MUI input

- **WHEN** the result of `useMuiField('email')` is spread onto an MUI `TextField`
- **THEN** the input is controlled and behaves identically to spreading `register('email')`

#### Scenario: error props omitted when valid

- **WHEN** the field has no validation error
- **THEN** the returned object does not contain `error` or `helperText` keys, so a consumer's own `helperText` survives the spread

### Requirement: MuiField component isolates re-renders via a render prop

The library SHALL provide a `<MuiField name options render={(props) => ReactNode} />` component (also accepting a function as `children`) that calls `useMuiField` internally and passes the resulting props to the render callback, providing field isolation without the consumer authoring a child component.

#### Scenario: render prop receives field props

- **WHEN** `<MuiField name="email" render={(props) => <TextField {...props} />} />` is rendered
- **THEN** the render callback receives the same props `useMuiField('email')` returns
- **AND** the wrapped input is controlled and isolated to the `MuiField` boundary

### Requirement: useMuiField and MuiField support checkbox and transform options

`useMuiField` and `<MuiField>` SHALL accept the same options as `register`, including `type: "checkbox"` (returning the `checked` boolean shape) and `transform: { input, output }` (mapping stored↔component values), with the same types and runtime behavior.

#### Scenario: checkbox option

- **WHEN** `useMuiField('acceptTerms', { type: 'checkbox' })` is used
- **THEN** it returns the `checked` boolean shape regardless of the current value

#### Scenario: transform option

- **WHEN** `useMuiField('start', { transform: { input, output } })` is used
- **THEN** the returned `value` is the result of `input(storedValue)` and a change stores `output(componentValue)`

### Requirement: register remains available and documented as non-isolated

`register` SHALL continue to work unchanged. Its documentation SHALL state that it derives its value via `watch`, which re-renders the host component on every change, and SHALL point to `useMuiField`/`<MuiField>` for forms that need per-field isolation.

#### Scenario: register behavior unchanged

- **WHEN** a consumer uses `register(name, options)` after this change
- **THEN** the returned props and runtime behavior are identical to before the change

#### Scenario: docs mention the scaling trade-off

- **WHEN** a consumer reads the `register` documentation
- **THEN** it notes the host-level re-render behavior and links to the isolated primitive
