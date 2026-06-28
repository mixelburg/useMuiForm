## ADDED Requirements

### Requirement: register returns synchronous void event handlers

The `onChange` and `onBlur` handlers returned by `register` SHALL be synchronous functions that return `void`. They MUST NOT be `async` and MUST NOT return a value, so the public type of each is `(event) => void` rather than `(event) => Promise<boolean>`.

#### Scenario: onChange handler type

- **WHEN** a consumer destructures `onChange` from `register(name)`
- **THEN** its type is `(event) => void` with no `Promise` or `boolean` in the signature

#### Scenario: onBlur handler type

- **WHEN** a consumer destructures `onBlur` from `register(name)`
- **THEN** its type is `(event) => void` with no `Promise` or `boolean` in the signature

#### Scenario: change propagation unchanged

- **WHEN** an input registered via `register` fires a change event
- **THEN** the underlying RHF field is updated exactly as before the handlers were made synchronous (no behavior change)
