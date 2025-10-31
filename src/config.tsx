import { createContext, type ReactNode, useContext } from "react";

export interface UseMuiFormConfig {
  requiredFieldErrorMessage?: string;
  defaultOpts?: {
    required?: boolean;
    lazy?: boolean;
  };
}

const UseMuiFormConfigContext = createContext<UseMuiFormConfig>({});

export function UseMuiFormConfigProvider({ children, config }: { children: ReactNode; config: UseMuiFormConfig }) {
  return <UseMuiFormConfigContext.Provider value={config}>{children}</UseMuiFormConfigContext.Provider>;
}

export const useUseMuiFormConfig = () => useContext(UseMuiFormConfigContext);
