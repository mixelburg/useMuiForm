import {get, set} from "lodash";
import {useEffect, useMemo, useRef, useState} from "react";
import {type UseMuiFormConfig, UseMuiFormConfigProvider, useUseMuiFormConfig} from "./config";
import type {DotPath, IErrorState, IOptions, IState, IStateOptions, ITouchedState, Register} from "./types";
import {checkValid, collectPaths, definedOr, generateErrorState, generateTouchedState} from "./utils";

export {UseMuiFormConfigProvider, type UseMuiFormConfig};

export type UseMuiFormOpts<State extends IState> = { defaultValues?: State };

export function useMuiForm<State extends IState>(opts?: UseMuiFormOpts<State>) {
  const config = useUseMuiFormConfig();

  // Initialize default state from options or empty object
  const {defaultState, statePaths} = useMemo(
    () => {
      const defaultState: State = opts?.defaultValues || ({} as State);
      return {defaultState, statePaths: collectPaths(defaultState)};
    },
    [],
  );

  const [state, setState] = useState<State>(defaultState);

  const stateOptionsRef = useRef<IStateOptions<State>>({});
  const stateOptions = stateOptionsRef.current;

  const hasForceValidatedRef = useRef<boolean>(false);

  const [errors, setErrors] = useState<IErrorState<State>>(generateErrorState(defaultState));
  const [touched, setTouched] = useState<ITouchedState<State>>(generateTouchedState(defaultState));

  const isAnyTouched = Object.values(touched).some(Boolean);
  const isChanged = JSON.stringify(state) !== JSON.stringify(defaultState);

  const handleChange = (name: DotPath<State>, type: "boolean" | "other") => (event: any) => {
    setTouched((ps) => {
      const newTouched = {...ps};
      set(newTouched, name, true);
      return newTouched;
    });

    const eventValue = event?.target ? (type === "boolean" ? event.target.checked : event.target.value) : event;

    setState((ps: State) => {
      const newState = {...ps};
      const pathKey = name as string;
      const cf = get(stateOptions, pathKey)?.format;
      const finalValue = cf ? cf(eventValue) : eventValue;
      set(newState, name, finalValue);
      return newState;
    });
  };

  const validate = (data: State, checkTouched: boolean = true): IErrorState<State> => {
    const newErrors = generateErrorState(defaultState);

    for (const path of statePaths) {
      const pathKey = path as string;
      const options = get(stateOptions, pathKey);

      if (options?.disabled) continue;
      if (!get(touched, pathKey) && checkTouched) continue;

      const value = get(data, pathKey);

      if (options?.required && !value) {
        set(newErrors, pathKey, config?.requiredFieldErrorMessage ?? "Field is required");
        continue;
      }

      const checkFunc = options?.validate as ((v: any, all: State) => string | true) | undefined;

      if (checkFunc) {
        const res = checkFunc(value, data);
        set(newErrors, pathKey, res === true ? undefined : res);
      }
    }
    return newErrors;
  };

  useEffect(() => {
    if (hasForceValidatedRef.current) setErrors(validate(state));
  }, [state]);

  const register = <Path extends DotPath<State>>(
    name: Path,
    options: IOptions<any, State> = {},
  ): Register<any, State> => {
    const pathKey = name as string;

    // Persist field settings
    set(stateOptions, pathKey, {
      required: definedOr(options.required, true),
      validate: options.validate,
      format: options.format,
      disabled: options.disabled,
    });

    const base = get(defaultState, name);
    const current = get(state, name);

    if (typeof base === "boolean") {
      return {
        name,
        onChange: handleChange(name, "boolean"),
        error: get(errors, name) ? true : undefined,
        disabled: options.disabled || false,
        helperText: options.helperText || get(errors, name),
        checked: definedOr(current, base) as boolean,
      } as unknown as Register<any, State>;
    }

    return {
      name,
      onChange: handleChange(name, "other"),
      error: get(errors, name) ? true : undefined,
      disabled: options.disabled || false,
      helperText: options.helperText || get(errors, name),
      value: definedOr(current, base),
    } as unknown as Register<any, State>;
  };

  const forceValidate = (): boolean => {
    hasForceValidatedRef.current = true;
    setTouched(generateTouchedState(defaultState, true));
    const res = validate(state, false);
    setErrors(res);
    return checkValid(res);
  };

  const clear = () => {
    hasForceValidatedRef.current = false;
    setState(defaultState);
    setErrors(generateErrorState(defaultState));
    setTouched(generateTouchedState(defaultState));
  };

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
