import { atom, type PrimitiveAtom, useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { type UseMuiFormConfig, UseMuiFormConfigProvider, useUseMuiFormConfig } from "./config";
import type { IErrorState, IOptions, IState, IStateOptions, ITouchedState, Register } from "./types";
import { checkValid, definedOr, generateErrorState, generateTouchedState } from "./utils";

export { UseMuiFormConfigProvider, type UseMuiFormConfig };

type PropsWithAtom<State extends IState> = { atom: PrimitiveAtom<State> };
type PropsWithDefaults<State extends IState> = { defaultValues: State };
type UseMuiFormOpts<State extends IState> = PropsWithAtom<State> | PropsWithDefaults<State>;

const isPropsWithAtom = <State extends IState>(opts: UseMuiFormOpts<State>): opts is PropsWithAtom<State> =>
  "atom" in opts && !!opts.atom;

const isPropsWithDefaults = <State extends IState>(opts: UseMuiFormOpts<State>): opts is PropsWithDefaults<State> =>
  "defaultValues" in opts && !!opts.defaultValues;

export function useMuiForm<State extends IState>(opts?: UseMuiFormOpts<State>) {
  const config = useUseMuiFormConfig();
  const hasAtom = opts ? isPropsWithAtom(opts) : false;
  const hasDefaults = opts ? isPropsWithDefaults(opts) : false;
  if (opts && !hasAtom && !hasDefaults) {
    throw new Error("useMuiForm: provide either { atom } or { defaultValues }.");
  }

  const stateAtom: PrimitiveAtom<State> = useMemo(
    () =>
      hasAtom
        ? (opts as PropsWithAtom<State>).atom
        : atom<State>(hasDefaults ? (opts as PropsWithDefaults<State>).defaultValues : ({} as State)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [state, setState] = useAtom(stateAtom);

  // Baseline used for clear(), error/touched shape, and isChanged comparison.
  // If defaultValues were provided, use them; otherwise, capture the atom's initial state on first render.
  const defaultStateRef = useRef<State>(
    (hasDefaults ? (opts as PropsWithDefaults<State>).defaultValues : state) as State,
  );
  const defaultState = defaultStateRef.current;

  const stateOptionsRef = useRef<IStateOptions<State>>({});
  const stateOptions = stateOptionsRef.current;

  const [errors, setErrors] = useState<IErrorState<State>>(generateErrorState(defaultState));
  const [touched, setTouched] = useState<ITouchedState<State>>(generateTouchedState(defaultState));

  const isAnyTouched = Object.values(touched).some(Boolean);
  const isChanged = JSON.stringify(state) !== JSON.stringify(defaultState);

  const handleChange =
    <Key extends keyof State>(name: Key, type: "boolean" | "other") =>
    (event: any) => {
      setTouched((ps) => ({ ...ps, [name]: true }));

      const eventValue = event?.target ? (type === "boolean" ? event.target.checked : event.target.value) : event;

      setState((ps: State) => {
        const cf = stateOptions[name]?.format;
        return {
          ...ps,
          [name]: cf ? cf(eventValue as State[Key]) : (eventValue as State[Key]),
        };
      });
    };

  const validate = (data: State, checkTouched: boolean = true): IErrorState<State> => {
    const newErrors: Partial<IErrorState<State>> = {};

    for (const key in defaultState) {
      if (stateOptions[key]?.disabled) continue;
      if (!touched[key as keyof State] && checkTouched) continue;

      if (stateOptions[key]?.required && !data[key as keyof State]) {
        newErrors[key as keyof State] = (config?.requiredFieldErrorMessage ?? "Field is required") as any;
        continue;
      }

      const checkFunc = stateOptions[key]?.validate as ((v: any, all: State) => string | true) | undefined;

      if (checkFunc) {
        const res = checkFunc(data[key as keyof State], data);
        newErrors[key as keyof State] = (res === true ? undefined : res) as any;
      }
    }
    return newErrors as IErrorState<State>;
  };

  useEffect(() => {
    setErrors(validate(state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const register = <Key extends keyof State>(
    name: Key,
    options: IOptions<State[Key], State> = {},
  ): Register<State[Key], State> => {
    // Persist field settings
    stateOptions[name] = {
      required: definedOr(options.required, true),
      validate: options.validate,
      format: options.format,
      disabled: options.disabled,
    };

    const base = defaultState[name];
    const current = state[name];

    if (typeof base === "boolean") {
      return {
        name,
        onChange: handleChange(name, "boolean"),
        error: (errors as any)[name] ? true : undefined,
        disabled: options.disabled || false,
        helperText: options.helperText || (errors as any)[name],
        checked: definedOr(current as any, base as any) as boolean,
      } as unknown as Register<State[Key], State>;
    }

    return {
      name,
      onChange: handleChange(name, "other"),
      error: (errors as any)[name] ? true : undefined,
      disabled: options.disabled || false,
      helperText: options.helperText || (errors as any)[name],
      value: definedOr(current as any, base as any) as Exclude<State[Key], boolean>,
    } as unknown as Register<State[Key], State>;
  };

  const forceValidate = (): boolean => {
    setTouched(generateTouchedState(defaultState, true));
    const res = validate(state, false);
    setErrors(res);
    return checkValid(res);
  };

  const clear = () => {
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
