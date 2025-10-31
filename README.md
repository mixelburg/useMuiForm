# useMuiForm

A lightweight custom React hook for **form management** with first-class support for **Material-UI (MUI)** and **MUI-X** components.

---

## ✨ Why?

This library was inspired by [react-hook-form](https://www.npmjs.com/package/react-hook-form).  
It follows similar API patterns and design decisions, but is **purpose-built for MUI**.

That means less boilerplate, smoother integration, and ready-to-use form utilities without extra wrappers.

---

## 📦 Installation

Choose your package manager:

```bash
npm i usemuiform
```

```bash
pnpm add usemuiform
```

```bash
yarn add usemuiform
```

```bash
bun add usemuiform
```

---

## 🚀 Demo

[👉 Live Demo on StackBlitz](https://stackblitz.com/github/mixelburg/usemuiform?file=test%2FApp.tsx)

---

## 🛠️ Usage

```tsx
import { useMuiForm } from 'usemuiform'

type State = {
  email: string
  role: 'root' | 'admin' | 'developer' | 'user' | 'guest' | ''
  racoon: boolean
}

const App: FC = () => {
  const { state, register, forceValidate, clear } = useMuiForm<State>({
    defaultValues: { email: '', role: '', racoon: false }
  })

  const submit = () => {
    if (forceValidate()) clear()
  }

  const emailValidator: ValidateFunc<string, State> = (value) => {
    if (value.length < 5) return 'Email must be at least 5 characters long'
    if (!value.includes('@')) return 'Email must contain @'
    return true
  }

  return (
    <>
      {/* TextField with validation */}
      <TextField
        label="email"
        type="email"
        variant="outlined"
        {...register('email', { required: true, validate: emailValidator })}
        fullWidth
      />

      {/* Select with options */}
      <TextField select label="role" variant="outlined" {...register('role')} fullWidth>
        {['root', 'admin', 'developer', 'user', 'guest'].map(role => (
          <MenuItem key={role} value={role}>
            {role}
          </MenuItem>
        ))}
      </TextField>

      {/* Checkbox */}
      <FormControlLabel label="Are you a racoon?" control={<Checkbox {...register('racoon')} />} />

      <Button variant="contained" onClick={submit}>
        SUBMIT
      </Button>
    </>
  )
}
```

---


## 📚 API

### `useMuiForm(options?)`

Custom hook that provides form management utilities.

#### Parameters
- **`options`** (optional): `{ defaultValues?: State }`

#### Returns
- **`state`** – Current form state
- **`setState`** – Update function
- **`errors`** – Validation errors object
- **`register`** – Field registration function
- **`forceValidate`** – Triggers validation on all fields
- **`clear`** – Resets the form state
- **`touched`** – Map of touched fields
- **`isAnyTouched`** – `true` if any field touched
- **`isChanged`** – `true` if state differs from defaults

---

### `register(name, options?)`

Registers a form field.

**Parameters:**
- `name`: Field name
- `options`:
    - `required?: boolean`
    - `validate?: (value, state) => true | string`
    - `format?: (value) => any`
    - `disabled?: boolean`
    - `helperText?: string`

**Returns:**
- `name`
- `value` (or `checked` if boolean)
- `onChange` handler
- `error` flag
- `helperText` (includes validation error if any)
- `disabled`

---

## 📦 Dependencies

- `react`

---

