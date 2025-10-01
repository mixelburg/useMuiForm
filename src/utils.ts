import type { IErrorState, ITouchedState } from "./types";

export const definedOr = <T, V>(value: T, other: V) => (value === undefined ? other : value);

export const generateErrorState = <S>(base: S): IErrorState<S> => {
  const e: Partial<IErrorState<S>> = {};
  for (const k in base) e[k] = undefined;
  return e as IErrorState<S>;
};

export const generateTouchedState = <S>(base: S, flag = false): ITouchedState<S> => {
  const t: Partial<ITouchedState<S>> = {};
  for (const k in base) t[k] = flag;
  return t as ITouchedState<S>;
};

export const checkValid = <S>(errors: IErrorState<S>): boolean => {
  for (const k in errors) if (errors[k] !== undefined) return false;
  return true;
};
