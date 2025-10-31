export type ValidateFunc<V, S> = (value: V, state: S) => string | true;
export type FormatFunc<V> = (value: V) => V;

export interface IOptions<V, S> {
  disabled?: boolean;
  validate?: ValidateFunc<V, S>;
  helperText?: string;

  required?: boolean;
  format?: FormatFunc<V>;
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

export type Register<V, S> = V extends boolean ? BooleanRegister<S> : GenericRegister<V, S>;

export interface BaseRegister<S> {
  name: DotPath<S>;
  error: boolean;
  disabled: boolean;
  helperText: string;
}

export interface ControlledBaseRegister<S> extends BaseRegister<S> {
  onChange: (e: any) => void;
}

export interface UncontrolledBaseRegister<S> extends BaseRegister<S> {
  inputRef: (ref: any) => void;
  onBlur: () => void;
}

export interface BooleanRegister<S> extends ControlledBaseRegister<S> {
  checked: boolean;
}

export interface GenericRegister<V, S> extends ControlledBaseRegister<S> {
  value: V;
}

export interface BooleanUncontrolledRegister<S> extends UncontrolledBaseRegister<S> {
  defaultChecked: boolean;
}

export interface GenericUncontrolledRegister<V, S> extends UncontrolledBaseRegister<S> {
  defaultValue: V;
}
