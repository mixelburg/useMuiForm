# useMuiForm

A custom React hook that provides utilities for form management, especially for Material-UI based forms.

## Start with why?
This library was inspired by [react-hook-form](https://www.npmjs.com/package/react-hook-form)
It uses similar api and similar design decisions, but it is made specifically for Material-UI components.
So you won't need to write a lot of boilerplate code to wrap and make it work with Material-UI components.
And Mui-X component. 

# Installation

```shell
npm i usemuiform
```

```shell
pnpm add usemuiform
```

```shell
yarn add usemuiform
```

```shell
bun add usemuiform
```

## Usage

```typescript jsx
type State = {
    email: string
    role: 'root' | 'admin' | 'developer' | 'user' | 'guest'
    racoon: boolean
}

const App: FC = () => {
    const {state, register, forceValidate, clear} = useMuiForm<State>()

    const submit = () => {
        if (forceValidate()) {
            clear()
        }
    }

    // validator example
    const emailValidator: ValidateFunc<string, State> = (value) => {
        if (value.length < 5) return 'Email must be at least 5 characters long'
        if (!value.includes('@')) return 'Email must contain @'
        return true
    }

    // components example
    // regular TextField with validation
    <TextField
        label='email'
        type='email'
        variant='outlined'
        {...register('email', '', {required: true, validate: emailValidator})}
        fullWidth
    />
    // select with options
    <TextField
        select
        label='role'
        variant='outlined'
        {...register('role', 'root', {})}
        fullWidth
    >
        {
            ['root', 'admin', 'developer', 'user', 'guest'].map(role =>
                <MenuItem key={role} value={role}>{role}</MenuItem>
            )
        }
    </TextField>
    // checkbox
    <FormControlLabel
        label="Are you a racoon?"
        control={
            <Checkbox
                {...register('racoon', false, {})}
            />
        }
    />
    <Button variant='contained' onClick={submit}>
        SUBMIT
    </Button>
}

```

## Advanced usage

you can you a custom atom as a state storage

```typescript jsx
import {atomWithHash} from "jotai-location";
import {atomWithStorage} from "jotai/utils";

const {} = useMuiForm<State>((defaultState) => atom<State>(defaultState))
const {} = useMuiForm<State>((defaultState) => atomWithHash<State>('state', defaultState))
const {} = useMuiForm<State>((defaultState) => atomWithStorage<State>('state', defaultState))
```

## API

`useMuiForm(atomProvider?)`
A custom hook that provides form management utilities.

### Parameters:

- `atomProvider`: (optional) A function that takes a default state and returns an Atom or PrimitiveAtom.

### Returns:

- `state`: The current form state.
- `setState`: Function to update the form state.
- `errors`: Object containing any validation errors.
- `register`: Function to register a form field.
- `forceValidate`: Function to force validation of the form.
- `clear`: Function to reset the form state.
- `touched`: Object indicating which fields have been touched/interacted with.
- `isAnyTouched`: Boolean indicating if any form field has been touched.
- `isChanged`: Boolean indicating if the form state has changed from the default.

- `register(name, defaultValue, options)`: Registers a form field.
  #### Parameters:
    - `name`: The name of the field.
    - `defaultValue`: The default value for the field.
    - `options` : (optional) An object with the following properties:
        - `required`: Boolean indicating if the field is required.
        - `validate`: A validation function.
          `<T>(value: T) => T | true`
        - `format`: A formatting function.
          `<T>(value: T) => T`
        - `disabled`: Boolean indicating if the field is disabled.
        - `helperText`: Helper text for the field.
  #### Returns:
    - `name`: The name of the field.
    - `value`: The current value of the field.
    - `onChange`: Function to update the value of the field.
    - `error`: Boolean indicating if the field has a validation error.
    - `helperText`: Helper text for the field. (contains validation error if present)
    - `disabled`: Boolean indicating if the field is disabled.
  > `value` is replaced with `checked` if the default value is a boolean.

## Dependencies

- react
- jotai




