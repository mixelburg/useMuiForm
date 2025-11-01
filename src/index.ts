import { get } from "lodash";
import { type FieldValues, type Path, type PathValue, type UseFormProps, useForm } from "react-hook-form";

type RegisterMuiReturn<TFieldValues extends FieldValues, TName extends Path<TFieldValues>> = {
  name: TName;
  onChange?: (event: any) => void;
  onBlur: (event: any) => void;
  ref: (instance: any) => void;
  error: boolean;
  helperText: string;
  inputRef: (instance: any) => void;
} & (PathValue<TFieldValues, TName> extends boolean
  ? { checked?: boolean; defaultChecked?: boolean; value?: never; defaultValue?: never }
  : PathValue<TFieldValues, TName> extends string
    ? {
        value?: PathValue<TFieldValues, TName> | "";
        defaultValue?: PathValue<TFieldValues, TName> | "";
        checked?: never;
        defaultChecked?: never;
      }
    : {
        value?: PathValue<TFieldValues, TName>;
        defaultValue?: PathValue<TFieldValues, TName>;
        checked?: never;
        defaultChecked?: never;
      });

export function useMuiForm<TFieldValues extends FieldValues = FieldValues>(options?: UseFormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>(options);
  const {
    register,
    formState: { errors, defaultValues },
    watch,
    setValue,
    trigger,
  } = methods;

  // Check if we're in controlled mode (onChange) or uncontrolled mode (onBlur, onSubmit, etc.)
  const isControlled = !options?.mode || options.mode === "onChange" || options.mode === "all";

  // Store refs for all inputs to access their values in onBlur

  function registerMui<Name extends Path<TFieldValues>>(
    name: Name,
    regOptions?: Parameters<typeof register<Name>>[1],
  ): RegisterMuiReturn<TFieldValues, Name> {
    const field = register(name, regOptions);
    const err = get(errors, name);
    // Use watch for controlled mode to keep value in sync, getValues for uncontrolled
    const currentValue = isControlled ? watch(name) : get(defaultValues, name);

    // Check if this is a checkbox field (value is boolean)
    const isCheckbox = typeof currentValue === "boolean";

    // Wrap onChange to handle different event types
    const wrappedOnChange = (event: any) => {
      if (event?.target?.value !== undefined) {
        event.target.value = event?.target ? (isCheckbox ? event.target.checked : event.target.value) : event;
        field.onChange(event);
      } else {
        setValue(name, event);
        trigger(name);
      }
    };

    const wrappedOnBlur = (event: any) => {
      if (event?.target?.value !== undefined) {
        event.target.value = event?.target ? (isCheckbox ? event.target.checked : event.target.value) : event;
        field.onBlur(event);
      }
    };

    const baseReturn = {
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
      } as unknown as RegisterMuiReturn<TFieldValues, Name>;
    }

    // Calculate final value with appropriate fallback
    const finalValue =
      currentValue !== undefined
        ? currentValue
        : ((typeof currentValue === "string" ? "" : currentValue) as PathValue<TFieldValues, Name>);

    return {
      ...baseReturn,
      ...(isControlled ? { value: finalValue } : { defaultValue: finalValue }),
    } as unknown as RegisterMuiReturn<TFieldValues, Name>;
  }

  return { ...methods, registerMui };
}
