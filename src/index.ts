import { get } from "lodash";
import React from "react";
import {
  type FieldValues,
  type Path,
  type PathValue,
  type RegisterOptions,
  type UseFormProps,
  useForm,
} from "react-hook-form";

type BaseRegisterMuiReturn<TName extends Path<any>> = {
  name: TName;
  onChange?: (event: any) => void;
  onBlur: (event: any) => void;
  error: boolean;
  helperText: string;
  inputRef: (instance: any) => void;
};

type RegisterMuiReturnBoolean<TName extends Path<any>> = BaseRegisterMuiReturn<TName> & {
  checked?: boolean;
  defaultChecked?: boolean;
  value?: never;
  defaultValue?: never;
};

type RegisterMuiReturnValue<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> = BaseRegisterMuiReturn<TName> & {
  value?: PathValue<TFieldValues, TName> | (PathValue<TFieldValues, TName> extends string ? "" : never);
  defaultValue?: PathValue<TFieldValues, TName> | (PathValue<TFieldValues, TName> extends string ? "" : never);
  checked?: never;
  defaultChecked?: never;
};

type RegisterMuiReturn<TFieldValues extends FieldValues, TName extends Path<TFieldValues>> = PathValue<
  TFieldValues,
  TName
> extends boolean
  ? RegisterMuiReturnBoolean<TName>
  : RegisterMuiReturnValue<TFieldValues, TName>;

const isChangeEvent = (v: unknown): v is React.ChangeEvent<HTMLInputElement> => {
  return (v as React.ChangeEvent<HTMLInputElement>)?.target?.value !== undefined;
};

export function useMuiForm<TFieldValues extends FieldValues = FieldValues>(options?: UseFormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>(options);
  const {
    register: registerHtml,
    formState: { errors, defaultValues },
    watch,
    setValue,
    trigger,
  } = methods;

  // Check if we're in controlled mode (onChange) or uncontrolled mode (onBlur, onSubmit, etc.)
  const isControlled = !options?.mode || options.mode === "onChange" || options.mode === "all";

  // Store refs for all inputs to access their values in onBlur

  function register<Name extends Path<TFieldValues>>(
    name: Name,
    regOptions?: RegisterOptions<TFieldValues, Name>,
  ): RegisterMuiReturn<TFieldValues, Name> {
    const field = registerHtml(name, regOptions);
    const err = get(errors, name);
    // Use watch for controlled mode to keep value in sync, getValues for uncontrolled
    const currentValue = isControlled ? watch(name) : get(defaultValues, name);

    // Check if this is a checkbox field (value is boolean)
    const isCheckbox = typeof currentValue === "boolean";

    // Wrap onChange to handle different event types
    const wrappedOnChange = (event: unknown) => {
      if (isChangeEvent(event)) {
        event.target.value = (isCheckbox ? event.target.checked : event.target.value) as string;
        field.onChange(event);
      } else {
        setValue(name, event as PathValue<TFieldValues, Name>);
        trigger(name);
      }
    };

    const wrappedOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (event?.target?.value !== undefined) {
        event.target.value = (isCheckbox ? event.target.checked : event.target.value) as string;
        field.onBlur(event);
      }
    };

    const baseReturn: BaseRegisterMuiReturn<Name> = {
      name,
      onChange: wrappedOnChange,
      onBlur: wrappedOnBlur,
      error: !!err,
      helperText: (err?.message as string) || "",
      inputRef: field.ref,
    };

    if (isCheckbox) {
      return {
        ...baseReturn,
        ...(isControlled ? { checked: currentValue as boolean } : { defaultChecked: currentValue as boolean }),
      } as RegisterMuiReturn<TFieldValues, Name>;
    }

    // Calculate final value with appropriate fallback
    const finalValue =
      currentValue !== undefined
        ? currentValue
        : ((typeof currentValue === "string" ? "" : currentValue) as PathValue<TFieldValues, Name>);

    return {
      ...baseReturn,
      ...(isControlled ? { value: finalValue } : { defaultValue: finalValue }),
    } as RegisterMuiReturn<TFieldValues, Name>;
  }

  return { ...methods, register, registerHtml };
}
