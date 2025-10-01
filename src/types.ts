export type ValidateFunc<V, S> = (value: V, state: S) => string | true;
export type FormatFunc<V> = (value: V) => V;

export interface IOptions<V, S> {
  disabled?: boolean;
  validate?: ValidateFunc<V, S>;
  helperText?: string;

  required?: boolean;
  format?: FormatFunc<V>;
}

export interface ISettings<V, S> {
  required: boolean;
  validate?: ValidateFunc<V, S>;
  format?: FormatFunc<V>;
  disabled?: boolean;
}

export type IStateOptions<S> = {
  [key in keyof S]?: ISettings<S[key], S>;
};

export interface IState {
  [key: string]: any;
}

export type IErrorState<S> = {
  [key in keyof S]: undefined | string;
};

export type ITouchedState<S> = {
  [key in keyof S]: boolean;
};

export type Register<V, S> = V extends boolean ? BooleanRegister<S> : GenericRegister<V, S>;

export interface BaseRegister<S> {
  name: keyof S;
  onChange: (e: any) => void;
  error: boolean;
  disabled: boolean;
  helperText: string;
}

export interface BooleanRegister<S> extends BaseRegister<S> {
  checked: boolean;
}

export interface GenericRegister<V, S> extends BaseRegister<S> {
  value: V;
}
