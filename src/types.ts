/**
 * Validation function type for field values.
 *
 * @typeParam V - The type of the field value being validated
 * @typeParam S - The type of the entire form state
 *
 * @param value - The current value of the field
 * @param state - The current state of the entire form
 * @returns `true` if valid, or an error message string if invalid
 *
 * @example
 * ```tsx
 * const emailValidator: ValidateFunc<string, FormState> = (value, state) => {
 *   if (value.length < 5) return 'Email must be at least 5 characters';
 *   if (!value.includes('@')) return 'Email must contain @';
 *   return true;
 * };
 * ```
 */
export type ValidateFunc<V, S> = (value: V, state: S) => string | true;

/**
 * Format function type for transforming field values.
 *
 * @typeParam V - The type of the field value
 *
 * @param value - The value to format
 * @returns The formatted value
 *
 * @example
 * ```tsx
 * const uppercaseFormatter: FormatFunc<string> = (value) => value.toUpperCase();
 * ```
 */
export type FormatFunc<V> = (value: V) => V;

/**
 * Options for configuring individual form fields when using the `register` function.
 *
 * @typeParam V - The type of the field value
 * @typeParam S - The type of the entire form state
 *
 * @example
 * ```tsx
 * <TextField
 *   {...register('email', {
 *     required: true,
 *     validate: (val) => val.includes('@') || 'Invalid email',
 *     helperText: 'Enter your email address',
 *     lazy: false
 *   })}
 * />
 * ```
 */
export interface IOptions<V, S> {
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Custom validation function */
  validate?: ValidateFunc<V, S>;
  /** Helper text to display below the field */
  helperText?: string;

  /** Whether the field is required (defaults to config value) */
  required?: boolean;
  /** Function to format/transform the value on change */
  format?: FormatFunc<V>;
  /** Use lazy (uncontrolled) mode for this field */
  lazy?: boolean;
}

export interface ISettings<V, S> {
  required: boolean;
  validate?: ValidateFunc<V, S>;
  format?: FormatFunc<V>;
  disabled?: boolean;
  lazy?: boolean;
}

export type IStateOptions<S> = {
  [key in keyof S]?: ISettings<S[key], S>;
};

export interface IState {
  [key: string]: any;
}

/**
 * Utility type that generates dot-notation paths for nested object properties.
 * Enables type-safe field registration with nested state structures.
 *
 * @typeParam T - The object type to generate paths for
 *
 * @example
 * ```tsx
 * type User = {
 *   name: string;
 *   address: {
 *     street: string;
 *     city: string;
 *   };
 * };
 * // DotPath<User> = "name" | "address" | "address.street" | "address.city"
 * ```
 */
// Type to represent dot-notation paths within an object
export type DotPath<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? K | `${K}.${DotPath<T[K]>}` : K;
    }[keyof T & string]
  : never;

export type IErrorState<S> = {
  [key in keyof S]: S[key] extends object ? IErrorState<S[key]> : undefined | string;
};

export type ITouchedState<S> = {
  [key in keyof S]: S[key] extends object ? ITouchedState<S[key]> : boolean;
};

/**
 * The return type of the `register` function. Automatically determines whether to return
 * boolean-specific props (checked) or generic props (value) based on the field type.
 *
 * @typeParam V - The type of the field value
 * @typeParam S - The type of the form state
 */
export type Register<V, S> = V extends boolean ? BooleanRegister<S> : GenericRegister<V, S>;

/**
 * Base properties included in all register return types.
 */
export interface BaseRegister<S> {
  /** The field name/path */
  name: DotPath<S>;
  /** Whether the field has a validation error */
  error: boolean;
  /** Whether the field is disabled */
  disabled: boolean;
  /** Helper text or error message to display */
  helperText: string;
}

/**
 * Base properties for controlled inputs.
 */
export interface ControlledBaseRegister<S> extends BaseRegister<S> {
  /** Change handler for controlled inputs */
  onChange: (e: any) => void;
}

/**
 * Base properties for uncontrolled (lazy) inputs.
 */
export interface UncontrolledBaseRegister<S> extends BaseRegister<S> {
  /** Ref callback to access the input element */
  inputRef: (ref: any) => void;
  /** Blur handler to sync value on blur */
  onBlur: () => void;
}

/**
 * Register return type for boolean fields (checkboxes, switches) in controlled mode.
 *
 * @example
 * ```tsx
 * <Checkbox {...register('isActive')} />
 * ```
 */
export interface BooleanRegister<S> extends ControlledBaseRegister<S> {
  /** The current checked state */
  checked: boolean;
}

/**
 * Register return type for non-boolean fields (text inputs, selects, etc.) in controlled mode.
 *
 * @example
 * ```tsx
 * <TextField {...register('email')} />
 * ```
 */
export interface GenericRegister<V, S> extends ControlledBaseRegister<S> {
  /** The current field value */
  value: V;
}
