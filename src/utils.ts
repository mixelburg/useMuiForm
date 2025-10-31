import type { DotPath, IErrorState, IState, ITouchedState } from "./types";

export const definedOr = <T, V>(value: T, other: V) => (value === undefined ? other : value);

export const isPlainRecord = (value: any) => {
  if (value === null || typeof value !== "object") return false;
  // Objects created by `{}` or `new Object`
  if (Object.getPrototypeOf(value) === Object.prototype) return true;
  // Objects created by `Object.create(null)` (no prototype at all)
  if (Object.getPrototypeOf(value) === null) return true;
  return false;
};

const generateState = <S, T>(base: S, leafValue: T, recurseFn: (val: any, leaf: T) => any): any => {
  const result: any = {};
  for (const k in base) {
    const value = base[k];
    if (isPlainRecord(value) && value !== null && !Array.isArray(value)) {
      result[k] = recurseFn(value, leafValue);
    } else {
      result[k] = leafValue;
    }
  }
  return result;
};

export const generateErrorState = <S>(base: S): IErrorState<S> => {
  return generateState(base, undefined, generateErrorState) as IErrorState<S>;
};

export const generateTouchedState = <S>(base: S, flag = false): ITouchedState<S> => {
  return generateState(base, flag, (val, f) => generateTouchedState(val, f)) as ITouchedState<S>;
};

export const checkValid = <S>(errors: IErrorState<S>): boolean => {
  for (const k in errors) {
    const value = errors[k];
    if (typeof value === "object" && value !== null) {
      if (!checkValid(value as any)) return false;
    } else if (value !== undefined) {
      return false;
    }
  }
  return true;
};

export const collectPaths = <T extends IState>(obj: T, prefix: string = ""): DotPath<T>[] => {
  const paths: string[] = [];
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      paths.push(...collectPaths(value, path));
    } else {
      paths.push(path);
    }
  }
  return paths as DotPath<T>[];
};
