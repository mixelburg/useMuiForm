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
      });

      const base = get(defaultState, name);
      const current = get(state, name);
      const fieldError = get(errors, name);
      const hasError = Boolean(fieldError);
      const helperText = options.helperText || fieldError;

      if (typeof base === "boolean") {
        return {
          name,
          onChange: handleChange(name, "boolean"),
          error: hasError,
          disabled: options.disabled || false,
          helperText,
          checked: definedOr(current, base) as boolean,
        } as unknown as Register<any, State>;
      }

      return {
        name,
        onChange: handleChange(name, "other"),
        error: hasError,
        disabled: options.disabled || false,
        helperText,
        value: definedOr(current, base),
      } as unknown as Register<any, State>;
    },
    [defaultState, state, errors, handleChange],
  );

  const forceValidate = useCallback((): boolean => {
    hasForceValidatedRef.current = true;
    setTouched(generateTouchedState(defaultState, true));
    const res = validate(state, false);
    setErrors(res);
    return checkValid(res);
  }, [defaultState, state, validate]);

  const clear = useCallback(() => {
    hasForceValidatedRef.current = false;
    setState(defaultState);
    setErrors(generateErrorState(defaultState));
    setTouched(generateTouchedState(defaultState));
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
