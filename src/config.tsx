import { createContext, type ReactNode, useContext } from "react";

/**
 * Global configuration options for useMuiForm behavior.
 * Can be set at the provider level or per-hook instance.
 *
 * @example
 * ```tsx
 * const config: UseMuiFormConfig = {
 *   requiredFieldErrorMessage: 'This field is required',
 *   defaultOpts: {
 *     required: true,
 *     lazy: false
 *   }
 * };
 * ```
 */
export interface UseMuiFormConfig {
  /** Error message to display for required fields that are empty */
  requiredFieldErrorMessage?: string;
  /** Default options applied to all registered fields */
  defaultOpts?: {
    /** Whether fields are required by default */
    required?: boolean;
    /** Whether to use lazy (uncontrolled) mode by default */
    lazy?: boolean;
  };
}

const UseMuiFormConfigContext = createContext<UseMuiFormConfig>({});

/**
 * Provider component for setting global useMuiForm configuration.
 * Wrap your app or form components with this to apply config to all forms within.
 *
 * @param props - Component props
 * @param props.children - Child components
 * @param props.config - Global configuration object
 *
 * @example
 * ```tsx
 * <UseMuiFormConfigProvider config={{ defaultOpts: { required: true } }}>
 *   <App />
 * </UseMuiFormConfigProvider>
 * ```
 */
export function UseMuiFormConfigProvider({ children, config }: { children: ReactNode; config: UseMuiFormConfig }) {
  return <UseMuiFormConfigContext.Provider value={config}>{children}</UseMuiFormConfigContext.Provider>;
}

/**
 * Hook to access the current useMuiForm configuration from context.
 * @internal
 */
export const useUseMuiFormConfig = () => useContext(UseMuiFormConfigContext);
