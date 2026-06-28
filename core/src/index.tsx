import React from "react";
import {
  type FieldValues,
  type Path,
  type PathValue,
  type RegisterOptions,
  FormProvider as RHFFormProvider,
  type UseFormProps,
  UseFormReturn,
  useForm,
  useFormContext as useRHFFormContext,
} from "react-hook-form";

type BaseRegisterMuiReturn<TName extends Path<any>> = {
  name: TName;
  onChange: (event: unknown) => void;
  onBlur: (event: any) => void;
  error: boolean;
  helperText: string;
  inputRef: (instance: any) => void;
};

type RegisterMuiReturnBoolean<TName extends Path<any>> = BaseRegisterMuiReturn<TName> & {
  /** Controlled checked state for MUI Checkbox/Switch */
  checked: boolean;
};

type RegisterMuiReturnValue<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> = BaseRegisterMuiReturn<TName> & {
  /** Controlled value for MUI text-like inputs */
  value: PathValue<TFieldValues, TName> | (PathValue<TFieldValues, TName> extends string ? "" : never);
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

function createMuiFormMethods<TFieldValues extends FieldValues>(methods: UseFormReturn<TFieldValues>) {
  const { register: registerHtml, formState, getFieldState, setValue, trigger, watch } = methods;

  function register<Name extends Path<TFieldValues>>(
    name: Name,
    regOptions?: RegisterOptions<TFieldValues, Name>,
  ): RegisterMuiReturn<TFieldValues, Name> {
    const field = registerHtml(name, regOptions);
    // Pass formState so getFieldState subscribes to errors and re-renders on error changes.
    const err = getFieldState(name, formState).error;

    // Use watch so the returned value/checked stays in sync with RHF state reactively.
    const currentValue = watch(name);
    const isCheckbox = typeof currentValue === "boolean";

    const wrappedOnChange = (event: unknown) => {
      if (isChangeEvent(event)) {
        if (isCheckbox) {
          field.onChange({
            target: {
              name,
              checked: event.target.checked as PathValue<TFieldValues, Name>,
              type: "checkbox",
            },
          });
        } else {
          field.onChange(event);
        }
      } else {
        setValue(name, event as PathValue<TFieldValues, Name>);
        trigger(name);
      }
    };

    const wrappedOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (event?.target?.value !== undefined) {
        if (isCheckbox) {
          field.onBlur({
            target: {
              name,
              checked: event.target.checked as PathValue<TFieldValues, Name>,
              type: "checkbox",
            },
          });
        } else {
          field.onBlur({
            target: {
              name,
              value: event.target.value as PathValue<TFieldValues, Name>,
            },
          });
        }
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
        checked: (currentValue as boolean | undefined) ?? false,
      } as RegisterMuiReturn<TFieldValues, Name>;
    }

    const finalValue = currentValue !== undefined ? currentValue : ("" as unknown as PathValue<TFieldValues, Name>);

    return {
      ...baseReturn,
      value: finalValue,
    } as RegisterMuiReturn<TFieldValues, Name>;
  }

  return { ...methods, register, registerHtml };
}

export function useMuiForm<TFieldValues extends FieldValues = FieldValues>(options?: UseFormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>(options);
  return createMuiFormMethods(methods);
}

export function useMuiFormContext<TFieldValues extends FieldValues = FieldValues>() {
  const methods = useRHFFormContext<TFieldValues>();
  return createMuiFormMethods(methods);
}

export type MuiFormProviderProps<TFieldValues extends FieldValues = FieldValues> = {
  children: React.ReactNode;
} & Omit<UseFormReturn<TFieldValues>, "register"> & {
    register: ReturnType<typeof useMuiForm<TFieldValues>>["register"];
    registerHtml: ReturnType<typeof useMuiForm<TFieldValues>>["registerHtml"];
  };

export function MuiFormProvider<TFieldValues extends FieldValues = FieldValues>(
  options: MuiFormProviderProps<TFieldValues>,
) {
  return <RHFFormProvider {...options} register={options.registerHtml} />;
}
