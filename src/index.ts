import {useEffect, useMemo, useState} from 'react'
import {useAtom} from 'jotai'
import {RESET} from 'jotai/utils'
import {atomWithHash} from 'jotai-location'
import {IErrorState, IOptions, IState, IStateOptions, ITouchedState, Register} from "./types";


const definedOr = <T, V>(value: T, other: V) => value === undefined ? other : value

const generateErrorState = <S>(defaultState: S): IErrorState<S> => {
    const errorState: Partial<IErrorState<S>> = {}
    for (const key in defaultState) {
        errorState[key] = undefined
    }
    return errorState as IErrorState<S>
}

const generateTouchedState = <S>(defaultState: S, flag: boolean = false): ITouchedState<S> => {
    const touchedState: Partial<ITouchedState<S>> = {}
    for (const key in defaultState) {
        touchedState[key] = flag
    }
    return touchedState as ITouchedState<S>
}

const checkValid = <S>(errors: IErrorState<S>): boolean => {
    for (const key in errors) {
        if (errors[key] !== undefined) {
            return false
        }
    }
    return true
}

const useMuiForm = <S extends IState = IState>(urlKey: string) => {
    const defaultState: S = {} as S
    const stateOptions: IStateOptions<S> = {}

    const memoFunc = () => atomWithHash<S>(urlKey, defaultState, {replaceState: true})
    // get return value type
    type MemoReturnType = ReturnType<typeof memoFunc>
    const stateAtom: MemoReturnType = useMemo(memoFunc, [])

    const [state, setState] = useAtom(stateAtom)

    const [errors, setErrors] = useState<any>(generateErrorState(defaultState))
    const [touched, setTouched] = useState<any>(generateTouchedState(defaultState))
    const isAnyTouched = Object.values(touched).some(v => !!v)

    const handleChange = (type: 'boolean' | 'other') => (e: any) => {
        // update touched state to reflect user interaction
        setTouched((ps: any) => {
            return {
                ...ps,
                [e.target.name]: true,
            }
        })
        // update state to reflect user input
        const eventValue = type === 'boolean' ? e.target.checked : e.target.value

        setState((ps: any) => {
            const cf = stateOptions[e.target.name]?.format
            return {
                ...ps,
                [e.target.name]: cf ? cf(eventValue as S[string]) : eventValue,
            }
        })
    }

    const validate = (data: S, checkTouched: boolean = true): IErrorState<S> => {
        const newErrors: Partial<IErrorState<S>> = {}

        for (const key in defaultState) {

            if (stateOptions[key]?.disabled) continue
            if (!touched[key] && checkTouched) continue

            // check if field is required
            if (stateOptions[key]?.required && !data[key]) {
                newErrors[key] = 'Field is required'
                continue
            }

            const checkFunc = stateOptions[key]?.validate
            if (checkFunc !== undefined) {
                const res: string | true = checkFunc(data[key], data)
                newErrors[key] = res === true ? undefined : res
            }
        }
        return newErrors as IErrorState<S>
    }

    useEffect(() => {
        setErrors(validate(state))
    }, [state])


    // name is a key of S
    // default value is the value of S[name]
    // const register = (name: keyof S, defaultValue: , options: IOptions<S[typeof name], S> = {}): Register<S[typeof name], S> => {
    const register = <K extends keyof S>(name: K, defaultValue: S[K], options: IOptions<S[K], S> = {}): Register<S[K], S> => {
        defaultState[name] = defaultValue

        stateOptions[name] = {
            required: definedOr(options.required, false),
            validate: options.validate,
            format: options.format,
            disabled: options.disabled,
        }

        const res = typeof defaultValue === 'boolean'
            ? {
                name,
                onChange: handleChange('boolean'),
                error: Boolean(errors[name]),
                disabled: options.disabled || false,
                helperText: options.helperText || errors[name],
                checked: definedOr(state[name], defaultValue),
            } : {
                name,
                onChange: handleChange('other'),
                error: Boolean(errors[name]),
                disabled: options.disabled || false,
                helperText: options.helperText || errors[name],
                value: definedOr(state[name], defaultValue),
            }
        return res as unknown as Register<S[typeof name], S>
    }

    const forceValidate = (): boolean => {
        setTouched(generateTouchedState(defaultState, true))
        const res = validate(state, false)
        setErrors(res)

        return checkValid(res)
    }

    const clear = () => {
        setState(defaultState)
        setErrors(generateErrorState(defaultState))
        setTouched(generateTouchedState(defaultState))
        setState(RESET)
    }

    return {
        state,
        setState,
        errors,
        register,
        forceValidate,
        clear,
        touched,
        isAnyTouched
    }
}

export default useMuiForm
