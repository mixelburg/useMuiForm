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
  /**
   * Controlled value for MUI text-like inputs. Includes `""` because `register`
   * falls back to `""` when the field is empty (`undefined`) so MUI inputs stay
   * controlled. For a string field this collapses to `string`; for e.g. a number
   * field it is `number | ""`, which is what an empty MUI input actually renders.
   */
  value: PathValue<TFieldValues, TName> | "";
};

type RegisterMuiReturn<TFieldValues extends FieldValues, TName extends Path<TFieldValues>> = PathValue<
  TFieldValues,
  TName
> extends boolean
  ? RegisterMuiReturnBoolean<TName>
  : RegisterMuiReturnValue<TFieldValues, TName>;

type MuiRegisterOptions<TFieldValues extends FieldValues, TName extends Path<TFieldValues>> = RegisterOptions<
  TFieldValues,
  TName
> & {
  /**
   * Mark this field as a checkbox/switch so `register` returns `checked` (boolean)
   * instead of `value`, regardless of the current value. Prefer this over relying on
   * the legacy `typeof value === "boolean"` auto-detection, which silently breaks when
   * the boolean isn't seeded in `defaultValues`.
   */
  type?: "checkbox";
};

const isChangeEvent = (v: unknown): v is React.ChangeEvent<HTMLInputElement> => {
  return (v as React.ChangeEvent<HTMLInputElement>)?.target?.value !== undefined;
};

function createMuiFormMethods<TFieldValues extends FieldValues>(methods: UseFormReturn<TFieldValues>) {
  const { register: registerHtml, formState, getFieldState, setValue, trigger, watch } = methods;

  function register<Name extends Path<TFieldValues>>(
    name: Name,
    regOptions: MuiRegisterOptions<TFieldValues, Name> & { type: "checkbox" },
  ): RegisterMuiReturnBoolean<Name>;
  function register<Name extends Path<TFieldValues>>(
    name: Name,
    regOptions?: MuiRegisterOptions<TFieldValues, Name>,
  ): RegisterMuiReturn<TFieldValues, Name>;
  function register<Name extends Path<TFieldValues>>(
    name: Name,
    regOptions?: MuiRegisterOptions<TFieldValues, Name>,
  ): RegisterMuiReturnBoolean<Name> | RegisterMuiReturnValue<TFieldValues, Name> {
    // `type` is our own option; strip it before handing the rest to react-hook-form.
    const { type, ...rhfOptions } = regOptions ?? {};
    const field = registerHtml(name, rhfOptions as RegisterOptions<TFieldValues, Name>);
    // Pass formState so getFieldState subscribes to errors and re-renders on error changes.
    const err = getFieldState(name, formState).error;

    // Use watch so the returned value/checked stays in sync with RHF state reactively.
    const currentValue = watch(name);
    // Explicit type: "checkbox" wins; otherwise fall back to inferring from a boolean value.
    const isCheckbox = type === "checkbox" || typeof currentValue === "boolean";

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
      } as RegisterMuiReturnBoolean<Name>;
    }

    // Fall back to "" when empty so MUI inputs stay controlled (see RegisterMuiReturnValue.value).
    const finalValue = currentValue !== undefined ? currentValue : "";

    return {
      ...baseReturn,
      value: finalValue,
    } as RegisterMuiReturnValue<TFieldValues, Name>;
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
