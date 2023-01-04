export enum InputType {
    CHECKBOX = 'checkbox',
    TEXT = 'text',
}

export type ValidateFunc = (value: any, state: any) => string | true
export type FormatFunc = (value: string) => string | undefined


export type IOptions = IOptionsInput | IOptionsCheckbox

export interface IBaseOptions<T> {
    disabled?: boolean;
    validate?: ValidateFunc;
    helperText?: string;

    type?: InputType
    default?: T
}

export interface IOptionsInput extends IBaseOptions<string> {
    required?: boolean;
    format?: FormatFunc;
    type?: InputType.TEXT;
}

export interface IOptionsCheckbox extends IBaseOptions<boolean> {
    type: InputType.CHECKBOX;
}

export interface ISettings {
    required: boolean;
    validate?: ValidateFunc;
    format?: FormatFunc;
    disabled?: boolean;
}

export interface IStateOptions {
    [key: string]: ISettings;
}

export interface IState {
    [key: string]: string | boolean;
}

export interface IErrorState {
    [key: string]: undefined | string;
}

export interface ITouchedState {
    [key: string]: boolean;
}
