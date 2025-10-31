import deepmerge from "deepmerge";
import { get, set } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type UseMuiFormConfig, UseMuiFormConfigProvider, useUseMuiFormConfig } from "./config";
import type { DotPath, IErrorState, IOptions, IState, IStateOptions, ITouchedState, Register } from "./types";
import { checkValid, collectPaths, definedOr, generateErrorState, generateTouchedState } from "./utils";

export { UseMuiFormConfigProvider, type UseMuiFormConfig };

/**
 * Options for configuring the useMuiForm hook.
 *
 * @typeParam State - The shape of the form state object
 *
 * @example
 * ```tsx
 * type FormState = { email: string; age: number };
 * const form = useMuiForm<FormState>({
 *   defaultValues: { email: '', age: 0 },
 *   config: { defaultOpts: { required: true } }
 * });
 * ```
 */
export type UseMuiFormOpts<State extends IState> = {
  /** Initial values for the form fields */
  defaultValues?: State;
  /** Configuration options for form behavior */
  config?: UseMuiFormConfig;
};

const defaultConfig: UseMuiFormConfig = {
  defaultOpts: {
    lazy: false,
    required: true,
  },
};

/**
 * A lightweight React hook for form management with first-class support for Material-UI (MUI) components.
 *
 * @typeParam State - The shape of your form state object
 *
 * @param opts - Configuration options for the form
 * @returns An object containing form state, handlers, and utility functions
 *
 * @example
 * Basic usage with TextField and validation
 * ```tsx
 * type FormState = {
 *   email: string;
 *   role: 'admin' | 'user' | '';
 *   isActive: boolean;
 * };
 *
 * const { state, register, forceValidate, clear } = useMuiForm<FormState>({
 *   defaultValues: { email: '', role: '', isActive: false }
 * });
 *
 * const emailValidator: ValidateFunc<string, FormState> = (value) => {
 *   if (!value.includes('@')) return 'Email must contain @';
 *   return true;
 * };
 *
 * // In JSX:
 * <TextField
 *   label="Email"
 *   {...register('email', { required: true, validate: emailValidator })}
 * />
 * ```
 *
 * @remarks
 * This hook provides:
 * - Automatic validation and error handling
 * - Support for both controlled and lazy (uncontrolled) inputs
 * - TypeScript-safe field registration with dot notation for nested paths
 * - Integration with MUI TextField, Checkbox, Select, and other components
 */
export function useMuiForm<State extends IState>(opts?: UseMuiFormOpts<State>) {
  const contextConfig = useUseMuiFormConfig();
  const config = useMemo(() => {
    let merged = deepmerge(defaultConfig, contextConfig || {});
    if (opts?.config) {
      merged = deepmerge(merged, opts.config);
    }
    return merged;
  }, [contextConfig, opts?.config]);

  // Initialize default state from options or empty object - memoize with proper dependencies
  // biome-ignore lint/correctness/useExhaustiveDependencies: <no reason>
  const { defaultState, statePaths } = useMemo(() => {
    const defaultState: State = opts?.defaultValues || ({} as State);
    return { defaultState, statePaths: collectPaths(defaultState) };
  }, []);

  const [state, setState] = useState<State>(defaultState);

  const stateOptionsRef = useRef<IStateOptions<State>>({});
  const inputRefsRef = useRef<Map<string, any>>(new Map());
  const hasForceValidatedRef = useRef<boolean>(false);

  const [errors, setErrors] = useState<IErrorState<State>>(() => generateErrorState(defaultState));
  const [touched, setTouched] = useState<ITouchedState<State>>(() => generateTouchedState(defaultState));

  // Memoize expensive computations
  const isAnyTouched = useMemo(() => Object.values(touched).some(Boolean), [touched]);
  const isChanged = useMemo(() => JSON.stringify(state) !== JSON.stringify(defaultState), [state, defaultState]);

  // Extract field validation logic
  const validateField = useCallback(
    (value: any, path: string, data: State): string | undefined => {
      const options = get(stateOptionsRef.current, path);

      if (options?.disabled) return undefined;

      if (options?.required && !value) {
        return config?.requiredFieldErrorMessage ?? "Field is required";
      }

      const checkFunc = options?.validate as ((v: any, all: State) => string | true) | undefined;
      if (checkFunc) {
        const res = checkFunc(value, data);
        return res === true ? undefined : res;
      }

      return undefined;
    },
    [config],
  );

  // Memoize validate function to use in useEffect
  const validate = useCallback(
    (data: State, checkTouched: boolean = true): IErrorState<State> => {
      const newErrors = generateErrorState(defaultState);

      for (const path of statePaths) {
        if (checkTouched && !get(touched, path)) continue;

        const value = get(data, path);
        const error = validateField(value, path, data);
        set(newErrors, path, error);
      }
      return newErrors;
    },
    [defaultState, statePaths, touched, validateField],
  );

  // Memoize handleChange to avoid recreation
  const handleChange = useCallback(
    (name: DotPath<State>, type: "boolean" | "other") => (event: any) => {
      setTouched((ps) => {
        const newTouched = { ...ps };
        set(newTouched, name, true);
        return newTouched;
      });

      const eventValue = event?.target ? (type === "boolean" ? event.target.checked : event.target.value) : event;

      setState((ps: State) => {
        const newState = { ...ps };
        const cf = get(stateOptionsRef.current, name)?.format;
        const finalValue = cf ? cf(eventValue) : eventValue;
        set(newState, name, finalValue);
        return newState;
      });
    },
    [],
  );

  // Memoize handleBlur for lazy inputs
  const handleBlur = useCallback(
    (name: DotPath<State>) => () => {
      const ref = inputRefsRef.current.get(name);
      if (!ref) return;

      const value = ref.value ?? ref.checked;
      const options = get(stateOptionsRef.current, name);
      const finalValue = options?.format ? options.format(value) : value;

      setTouched((ps) => {
        const newTouched = { ...ps };
        set(newTouched, name, true);
        return newTouched;
      });

      setState((ps: State) => {
        const newState = { ...ps };
        set(newState, name, finalValue);

        // Validate this specific field for lazy inputs
        const fieldError = validateField(finalValue, name, newState);

        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          set(newErrors, name, fieldError);
          return newErrors;
        });

        return newState;
      });
    },
    [validateField],
  );

  useEffect(() => {
    if (hasForceValidatedRef.current) setErrors(validate(state));
  }, [state, validate]);

  const register = useCallback(
    <Path extends DotPath<State>>(name: Path, options: IOptions<any, State> = {}): Register<any, State> => {
      // Apply default options from config
      const mergedOptions = {
        ...options,
        required: definedOr(options.required, config?.defaultOpts?.required ?? true),
        lazy: definedOr(options.lazy, config?.defaultOpts?.lazy ?? false),
      };

      // Persist field settings
      set(stateOptionsRef.current, name, {
        required: mergedOptions.required,
        validate: mergedOptions.validate,
        format: mergedOptions.format,
        disabled: mergedOptions.disabled,
        lazy: mergedOptions.lazy,
      });

      const base = get(defaultState, name);
      const current = get(state, name);
      const fieldError = get(errors, name);
      const hasError = Boolean(fieldError);
      const helperText = mergedOptions.helperText || fieldError;

      const baseProps = {
        name,
        error: hasError,
        helperText,
        disabled: mergedOptions.disabled || false,
      };

      const lazyProps = {
        ...baseProps,
        inputRef: (ref: any) => {
          if (ref) inputRefsRef.current.set(name, ref);
        },
        onBlur: handleBlur(name),
      };

      const controlledProps = {
        ...baseProps,
      };

      // Lazy (uncontrolled) mode
      if (mergedOptions.lazy) {
        if (typeof base === "boolean") {
          return {
            ...lazyProps,
            defaultChecked: definedOr(current, base) as boolean,
          } as unknown as Register<any, State>;
        }

        return {
          ...lazyProps,
          defaultValue: definedOr(current, base),
        } as unknown as Register<any, State>;
      }

      // Controlled mode
      if (typeof base === "boolean") {
        return {
          ...controlledProps,
          onChange: handleChange(name, "boolean"),
          checked: definedOr(current, base) as boolean,
        } as unknown as Register<any, State>;
      }

      return {
        ...controlledProps,
        onChange: handleChange(name, "other"),
        value: definedOr(current, base),
      } as unknown as Register<any, State>;
    },
    [defaultState, state, errors, handleChange, handleBlur, config],
  );

  const forceValidate = useCallback((): boolean => {
    // Collect values from lazy inputs
    const collectedState = { ...state };
    inputRefsRef.current.forEach((ref, path) => {
      const value = ref.value ?? ref.checked;
      const options = get(stateOptionsRef.current, path);
      const finalValue = options?.format ? options.format(value) : value;
      set(collectedState, path, finalValue);
    });

    // Update state with collected values
    setState(collectedState);

    hasForceValidatedRef.current = true;
    setTouched(generateTouchedState(defaultState, true));
    const res = validate(collectedState, false);
    setErrors(res);
    return checkValid(res);
  }, [defaultState, state, validate]);

  const getValues = useCallback((): State => {
    // Collect values from lazy inputs
    const collectedState = { ...state };
    inputRefsRef.current.forEach((ref, path) => {
      const value = ref.value ?? ref.checked;
      const options = get(stateOptionsRef.current, path);
      const finalValue = options?.format ? options.format(value) : value;
      set(collectedState, path, finalValue);
    });
    return collectedState;
  }, [state]);

  const clear = useCallback(() => {
    hasForceValidatedRef.current = false;
    setState(defaultState);
    setErrors(generateErrorState(defaultState));
    setTouched(generateTouchedState(defaultState));

    // Reset lazy input refs to their default values
    inputRefsRef.current.forEach((ref, path) => {
      const defaultValue = get(defaultState, path);
      if (typeof defaultValue === "boolean") {
        ref.checked = defaultValue;
      } else {
        ref.value = defaultValue ?? "";
      }
    });
  }, [defaultState]);

  return {
    state,
    setState,

    errors,
    setErrors,

    touched,
    setTouched,

    register,

    forceValidate,
    getValues,
    clear,

    isAnyTouched,
    isChanged,
  };
}
