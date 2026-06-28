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
  /** Only present (and `true`) when the field has an error, so a consumer's own `error` prop survives the spread. */
  error?: boolean;
  /** Only present when there's an error message, so a consumer's own `helperText` (e.g. a static hint) survives the spread. */
  helperText?: string;
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

/** Converts between the stored model value and the component's value. */
type MuiTransform<TStored, TComponent> = {
  /** Map the stored value -> the component's value (on read). */
  input: (value: TStored) => TComponent;
  /** Map the component's value -> the stored value (on change). */
  output: (value: TComponent) => TStored;
};

type RegisterMuiReturnTransformed<TName extends Path<any>, TComponent> = BaseRegisterMuiReturn<TName> & {
  /** Controlled value, mapped from the stored value through `transform.input`. */
  value: TComponent;
};

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

/** The MUI-enhanced `register` function (overloaded for checkbox / transform / value fields). */
export type MuiRegister<TFieldValues extends FieldValues> = {
  <Name extends Path<TFieldValues>>(
    name: Name,
    regOptions: MuiRegisterOptions<TFieldValues, Name> & { type: "checkbox" },
  ): RegisterMuiReturnBoolean<Name>;
  <Name extends Path<TFieldValues>, TComponent>(
    name: Name,
    regOptions: MuiRegisterOptions<TFieldValues, Name> & {
      transform: MuiTransform<PathValue<TFieldValues, Name>, TComponent>;
    },
  ): RegisterMuiReturnTransformed<Name, TComponent>;
  <Name extends Path<TFieldValues>>(
    name: Name,
    regOptions?: MuiRegisterOptions<TFieldValues, Name>,
  ): RegisterMuiReturn<TFieldValues, Name>;
};

/** Return type of `useMuiForm` / `useMuiFormContext`: react-hook-form's methods plus the MUI register. */
export type UseMuiFormReturn<TFieldValues extends FieldValues> = Omit<UseFormReturn<TFieldValues>, "register"> & {
  register: MuiRegister<TFieldValues>;
  registerHtml: UseFormReturn<TFieldValues>["register"];
};

const isChangeEvent = (v: unknown): v is React.ChangeEvent<HTMLInputElement> => {
  return (v as React.ChangeEvent<HTMLInputElement>)?.target?.value !== undefined;
};

function createMuiFormMethods<TFieldValues extends FieldValues>(
  methods: UseFormReturn<TFieldValues>,
): UseMuiFormReturn<TFieldValues> {
  const { register: registerHtml, formState, getFieldState, setValue, trigger, watch } = methods;

  function register<Name extends Path<TFieldValues>>(
    name: Name,
    regOptions: MuiRegisterOptions<TFieldValues, Name> & { type: "checkbox" },
  ): RegisterMuiReturnBoolean<Name>;
  function register<Name extends Path<TFieldValues>, TComponent>(
    name: Name,
    regOptions: MuiRegisterOptions<TFieldValues, Name> & {
      transform: MuiTransform<PathValue<TFieldValues, Name>, TComponent>;
    },
  ): RegisterMuiReturnTransformed<Name, TComponent>;
  function register<Name extends Path<TFieldValues>>(
    name: Name,
    regOptions?: MuiRegisterOptions<TFieldValues, Name>,
  ): RegisterMuiReturn<TFieldValues, Name>;
  function register<Name extends Path<TFieldValues>>(
    name: Name,
    regOptions?: MuiRegisterOptions<TFieldValues, Name> & {
      transform?: MuiTransform<PathValue<TFieldValues, Name>, unknown>;
    },
  ):
    | RegisterMuiReturnBoolean<Name>
    | RegisterMuiReturnValue<TFieldValues, Name>
    | RegisterMuiReturnTransformed<Name, unknown> {
    // `type` and `transform` are our own options; strip them before handing the rest to react-hook-form.
    const { type, transform, ...rhfOptions } = regOptions ?? {};
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
        } else if (transform) {
          setValue(name, transform.output(event.target.value) as PathValue<TFieldValues, Name>);
          trigger(name);
        } else {
          field.onChange(event);
        }
      } else {
        // Raw (non-event) value, e.g. from a date/currency picker's onChange(value).
        const stored = transform ? transform.output(event) : event;
        setValue(name, stored as PathValue<TFieldValues, Name>);
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
      inputRef: field.ref,
      // Only include error/helperText when there's an error, so a consumer's own
      // error/helperText props (e.g. a static hint) aren't clobbered by false/"".
      ...(err && { error: true }),
      ...(err?.message && { helperText: err.message as string }),
    };

    if (isCheckbox) {
      return {
        ...baseReturn,
        checked: (currentValue as boolean | undefined) ?? false,
      } as RegisterMuiReturnBoolean<Name>;
    }

    if (transform) {
      // Map the stored value to the component's value; let the consumer's input() decide how to
      // represent an empty/undefined value (e.g. null for a date picker) rather than forcing "".
      return {
        ...baseReturn,
        value: transform.input(currentValue as PathValue<TFieldValues, Name>),
      } as RegisterMuiReturnTransformed<Name, unknown>;
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

export function useMuiForm<TFieldValues extends FieldValues = FieldValues>(
  options?: UseFormProps<TFieldValues>,
): UseMuiFormReturn<TFieldValues> {
  const methods = useForm<TFieldValues>(options);
  return createMuiFormMethods(methods);
}

export function useMuiFormContext<TFieldValues extends FieldValues = FieldValues>(): UseMuiFormReturn<TFieldValues> {
  const methods = useRHFFormContext<TFieldValues>();
  return createMuiFormMethods(methods);
}

export type MuiFormProviderProps<TFieldValues extends FieldValues = FieldValues> = {
  children: React.ReactNode;
} & Omit<UseFormReturn<TFieldValues>, "register"> & {
    register: MuiRegister<TFieldValues>;
    registerHtml: UseMuiFormReturn<TFieldValues>["registerHtml"];
  };

export function MuiFormProvider<TFieldValues extends FieldValues = FieldValues>(
  options: MuiFormProviderProps<TFieldValues>,
) {
  return <RHFFormProvider {...options} register={options.registerHtml} />;
}
