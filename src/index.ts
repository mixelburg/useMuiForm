import { get, set } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type UseMuiFormConfig, UseMuiFormConfigProvider, useUseMuiFormConfig } from "./config";
import type { DotPath, IErrorState, IOptions, IState, IStateOptions, ITouchedState, Register } from "./types";
import { checkValid, collectPaths, definedOr, generateErrorState, generateTouchedState } from "./utils";

export { UseMuiFormConfigProvider, type UseMuiFormConfig };

export type UseMuiFormOpts<State extends IState> = { defaultValues?: State };

export function useMuiForm<State extends IState>(opts?: UseMuiFormOpts<State>) {
  const config = useUseMuiFormConfig();

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

  // Memoize validate function to use in useEffect
  const validate = useCallback(
    (data: State, checkTouched: boolean = true): IErrorState<State> => {
      const newErrors = generateErrorState(defaultState);

      for (const path of statePaths) {
        const options = get(stateOptionsRef.current, path);

        if (options?.disabled) continue;
        if (checkTouched && !get(touched, path)) continue;

        const value = get(data, path);

        if (options?.required && !value) {
          set(newErrors, path, config?.requiredFieldErrorMessage ?? "Field is required");
          continue;
        }

        const checkFunc = options?.validate as ((v: any, all: State) => string | true) | undefined;

        if (checkFunc) {
          const res = checkFunc(value, data);
          set(newErrors, path, res === true ? undefined : res);
        }
      }
      return newErrors;
    },
    [defaultState, statePaths, touched, config],
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
        return newState;
      });
    },
    [],
  );

  useEffect(() => {
    if (hasForceValidatedRef.current) setErrors(validate(state));
  }, [state, validate]);

  const register = useCallback(
    <Path extends DotPath<State>>(name: Path, options: IOptions<any, State> = {}): Register<any, State> => {
      // Persist field settings
      set(stateOptionsRef.current, name, {
        required: definedOr(options.required, true),
        validate: options.validate,
        format: options.format,
        disabled: options.disabled,
        lazy: options.lazy,
      });

      const base = get(defaultState, name);
      const current = get(state, name);
      const fieldError = get(errors, name);
      const hasError = Boolean(fieldError);
      const helperText = options.helperText || fieldError;

      const baseProps = {
        name,
        error: hasError,
        helperText,
        disabled: options.disabled || false,
      };

      const lazyProps = {
        ...baseProps,
        inputRef: (ref: any) => {
          if (ref) inputRefsRef.current.set(name, ref);
        },
        onBlur: handleBlur(name),
      };

      const controlleddProps = {
        ...baseProps,
        onChange: handleChange(name, "boolean"),
      };

      // Lazy (uncontrolled) mode
      if (options.lazy) {
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
          ...controlleddProps,
          checked: definedOr(current, base) as boolean,
        } as unknown as Register<any, State>;
      }

      return {
        ...controlleddProps,
        value: definedOr(current, base),
      } as unknown as Register<any, State>;
    },
    [defaultState, state, errors, handleChange, handleBlur],
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
    register,
    forceValidate,
    clear,
    touched,
    isAnyTouched,
    isChanged,
  };
}
