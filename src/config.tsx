import { createContext, type ReactNode, useContext } from "react";

export interface UseMuiFormConfig {
  requiredFieldErrorMessage?: string;
}

const UseMuiFormConfigContext = createContext<UseMuiFormConfig | undefined>(undefined);

export function UseMuiFormConfigProvider({ children, config }: { children: ReactNode; config: UseMuiFormConfig }) {
  return <UseMuiFormConfigContext.Provider value={config}>{children}</UseMuiFormConfigContext.Provider>;
}

export const useUseMuiFormConfig = () => useContext(UseMuiFormConfigContext);
