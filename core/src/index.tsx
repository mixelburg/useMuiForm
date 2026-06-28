import React from "react";
import {
  type FieldError,
  type FieldValues,
  type Path,
  type PathValue,
  type RegisterOptions,
  FormProvider as RHFFormProvider,
  type UseFormProps,
  UseFormReturn,
  useController,
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

export type RegisterMuiReturnBoolean<TName extends Path<any>> = BaseRegisterMuiReturn<TName> & {
  /** Controlled checked state for MUI Checkbox/Switch */
  checked: boolean;
};

export type RegisterMuiReturnValue<
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

export type RegisterMuiReturn<TFieldValues extends FieldValues, TName extends Path<TFieldValues>> = PathValue<
  TFieldValues,
  TName
> extends boolean
  ? RegisterMuiReturnBoolean<TName>
  : RegisterMuiReturnValue<TFieldValues, TName>;

/** Converts between the stored model value and the component's value. */
export type MuiTransform<TStored, TComponent> = {
  /** Map the stored value -> the component's value (on read). */
  input: (value: TStored) => TComponent;
  /** Map the component's value -> the stored value (on change). */
  output: (value: TComponent) => TStored;
};

export type RegisterMuiReturnTransformed<TName extends Path<any>, TComponent> = BaseRegisterMuiReturn<TName> & {
  /** Controlled value, mapped from the stored value through `transform.input`. */
  value: TComponent;
};

export type MuiRegisterOptions<TFieldValues extends FieldValues, TName extends Path<TFieldValues>> = RegisterOptions<
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

type AnyTransform = MuiTransform<unknown, unknown>;

/**
 * Build the MUI `onChange` from backend commit primitives, shared by `register` (RHF
 * uncontrolled) and `useMuiField` (`useController`).
 * - `passEvent`: forward a (possibly synthetic) event to RHF, which extracts the value.
 * - `setRaw`: store an already-computed raw value.
 */
const makeOnChange = (
  name: string,
  isCheckbox: boolean,
  transform: AnyTransform | undefined,
  passEvent: (event: any) => unknown,
  setRaw: (value: unknown) => void,
) => {
  return (event: unknown) => {
    if (isChangeEvent(event)) {
      if (isCheckbox) {
        passEvent({ target: { name, checked: event.target.checked, type: "checkbox" } });
      } else if (transform) {
        setRaw(transform.output(event.target.value));
      } else {
        passEvent(event);
      }
    } else {
      // Raw (non-event) value, e.g. from a date/currency picker's onChange(value).
      setRaw(transform ? transform.output(event) : event);
    }
  };
};

const makeOnBlur = (name: string, isCheckbox: boolean, rhfBlur: (event: any) => unknown) => {
  return (event: React.FocusEvent<HTMLInputElement>) => {
    if (event?.target?.value !== undefined) {
      rhfBlur(
        isCheckbox
          ? { target: { name, checked: event.target.checked, type: "checkbox" } }
          : { target: { name, value: event.target.value } },
      );
    }
  };
};

/** Assemble the MUI props from already-resolved pieces. Shared by `register` and `useMuiField`. */
const buildFieldProps = (
  name: string,
  currentValue: unknown,
  error: FieldError | undefined,
  ref: (instance: unknown) => void,
  isCheckbox: boolean,
  transform: AnyTransform | undefined,
  onChange: (event: unknown) => void,
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void,
) => {
  const base = {
    name,
    onChange,
    onBlur,
    inputRef: ref,
    // Only include error/helperText when there's an error, so a consumer's own
    // error/helperText props (e.g. a static hint) aren't clobbered by false/"".
    ...(error && { error: true }),
    ...(error?.message && { helperText: error.message as string }),
  };
  if (isCheckbox) {
    return { ...base, checked: (currentValue as boolean | undefined) ?? false };
  }
  if (transform) {
    // Let the consumer's input() decide how to represent empty/undefined (e.g. null for a picker).
    return { ...base, value: transform.input(currentValue) };
  }
  // Fall back to "" when empty so MUI inputs stay controlled (see RegisterMuiReturnValue.value).
  return { ...base, value: currentValue !== undefined ? currentValue : "" };
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
    const t = transform as AnyTransform | undefined;

    // register commits native/checkbox events through RHF (preserving valueAs*); transform/raw
    // values go via setValue + trigger, as before.
    const onChange = makeOnChange(name, isCheckbox, t, field.onChange, (value) => {
      setValue(name, value as PathValue<TFieldValues, Name>);
      trigger(name);
    });
    const onBlur = makeOnBlur(name, isCheckbox, field.onBlur);

    const props = buildFieldProps(name, currentValue, err, field.ref, isCheckbox, t, onChange, onBlur);
    return props as
      | RegisterMuiReturnBoolean<Name>
      | RegisterMuiReturnValue<TFieldValues, Name>
      | RegisterMuiReturnTransformed<Name, unknown>;
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

/**
 * Field-level primitive backed by `useController`. Unlike `register` (which derives its value from
 * `watch` and re-renders the host on every change), `useMuiField` subscribes in isolation, so a field
 * rendered inside its own component re-renders alone. Must be used within a `MuiFormProvider`.
 * Returns the same prop shape as `register`, including `type: "checkbox"` and `transform` support.
 */
export function useMuiField<TFieldValues extends FieldValues, Name extends Path<TFieldValues>>(
  name: Name,
  options: MuiRegisterOptions<TFieldValues, Name> & { type: "checkbox" },
): RegisterMuiReturnBoolean<Name>;
export function useMuiField<TFieldValues extends FieldValues, Name extends Path<TFieldValues>, TComponent>(
  name: Name,
  options: MuiRegisterOptions<TFieldValues, Name> & {
    transform: MuiTransform<PathValue<TFieldValues, Name>, TComponent>;
  },
): RegisterMuiReturnTransformed<Name, TComponent>;
export function useMuiField<TFieldValues extends FieldValues, Name extends Path<TFieldValues>>(
  name: Name,
  options?: MuiRegisterOptions<TFieldValues, Name>,
): RegisterMuiReturn<TFieldValues, Name>;
export function useMuiField<TFieldValues extends FieldValues, Name extends Path<TFieldValues>>(
  name: Name,
  options?: MuiRegisterOptions<TFieldValues, Name> & {
    transform?: MuiTransform<PathValue<TFieldValues, Name>, unknown>;
  },
):
  | RegisterMuiReturnBoolean<Name>
  | RegisterMuiReturnValue<TFieldValues, Name>
  | RegisterMuiReturnTransformed<Name, unknown> {
  const { type, transform, ...rules } = options ?? {};
  const { control } = useRHFFormContext<TFieldValues>();
  const { field, fieldState } = useController<TFieldValues, Name>({
    name,
    control,
    rules: rules as RegisterOptions<TFieldValues, Name>,
  });

  const currentValue = field.value;
  const isCheckbox = type === "checkbox" || typeof currentValue === "boolean";
  const t = transform as AnyTransform | undefined;

  // useController's onChange handles both events and raw values, so it serves both commit paths.
  const onChange = makeOnChange(name, isCheckbox, t, field.onChange, field.onChange);
  const onBlur = makeOnBlur(name, isCheckbox, field.onBlur);

  const props = buildFieldProps(name, currentValue, fieldState.error, field.ref, isCheckbox, t, onChange, onBlur);
  return props as
    | RegisterMuiReturnBoolean<Name>
    | RegisterMuiReturnValue<TFieldValues, Name>
    | RegisterMuiReturnTransformed<Name, unknown>;
}

type MuiFieldRenderProps<TFieldValues extends FieldValues, Name extends Path<TFieldValues>, O> = O extends {
  type: "checkbox";
}
  ? RegisterMuiReturnBoolean<Name>
  : O extends { transform: MuiTransform<PathValue<TFieldValues, Name>, infer TComponent> }
    ? RegisterMuiReturnTransformed<Name, TComponent>
    : RegisterMuiReturn<TFieldValues, Name>;

export type MuiFieldProps<
  TFieldValues extends FieldValues,
  Name extends Path<TFieldValues>,
  O extends MuiRegisterOptions<TFieldValues, Name> & {
    transform?: MuiTransform<PathValue<TFieldValues, Name>, unknown>;
  } = MuiRegisterOptions<TFieldValues, Name>,
> = O & {
  name: Name;
  /** Receives the field props (the same shape `useMuiField(name, options)` returns). */
  render?: (props: MuiFieldRenderProps<TFieldValues, Name, O>) => React.ReactNode;
  children?: (props: MuiFieldRenderProps<TFieldValues, Name, O>) => React.ReactNode;
};

/**
 * Isolated field component: a thin wrapper over `useMuiField` that passes the field props to a
 * `render` prop (or function `children`). Because it is its own component, only it re-renders when
 * its field changes — the drop-in `<Controller>` replacement with the MUI mapping built in.
 */
export function MuiField<
  TFieldValues extends FieldValues,
  Name extends Path<TFieldValues>,
  O extends MuiRegisterOptions<TFieldValues, Name> & {
    transform?: MuiTransform<PathValue<TFieldValues, Name>, unknown>;
  } = MuiRegisterOptions<TFieldValues, Name>,
>(props: MuiFieldProps<TFieldValues, Name, O>) {
  const { name, render, children, ...options } = props;
  const fieldProps = useMuiField<TFieldValues, Name>(name, options as MuiRegisterOptions<TFieldValues, Name>);
  const renderFn = render ?? children;
  return <>{renderFn ? renderFn(fieldProps as MuiFieldRenderProps<TFieldValues, Name, O>) : null}</>;
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
