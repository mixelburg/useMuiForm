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

const useMuiForm = <State extends IState = IState>(urlKey: string) => {
    const defaultState: State = {} as State
    const stateOptions: IStateOptions<State> = {}
    const memoFunc = () => atomWithHash<State>(urlKey, defaultState, {replaceState: true})
    // get return value type
    type MemoReturnType = ReturnType<typeof memoFunc>
    const stateAtom: MemoReturnType = useMemo(memoFunc, [])

    const [state, setState] = useAtom(stateAtom)

    const [errors, setErrors] = useState<any>(generateErrorState(defaultState))
    const [touched, setTouched] = useState<any>(generateTouchedState(defaultState))
    const isAnyTouched = Object.values(touched).some(v => !!v)

    const isChanged = JSON.stringify(state) !== JSON.stringify(defaultState)

    const handleChange = <Key extends keyof State>(name: Key, type: 'boolean' | 'other') => (event: any) => {
        // update touched state to reflect user interaction
        setTouched((ps: any) => {
            return {
                ...ps,
                [name]: true,
            }
        })
        // update state to reflect user input
        const eventValue = event.target
            ? type === 'boolean'
                ? event.target?.checked
                : event.target?.value
            : event

        setState((ps: any) => {
            const cf = stateOptions[name]?.format
            return {
                ...ps,
                [name]: cf ? cf(eventValue as State[Key]) : eventValue,
            }
        })
    }

    const validate = (data: State, checkTouched: boolean = true): IErrorState<State> => {
        const newErrors: Partial<IErrorState<State>> = {}

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
        return newErrors as IErrorState<State>
    }

    useEffect(() => {
        setErrors(validate(state))
    }, [state])


    // name is a key of S
    // default value is the value of S[name]
    // const register = (name: keyof S, defaultValue: , options: IOptions<S[typeof name], S> = {}): Register<S[typeof name], S> => {
    const register = <Key extends keyof State>(name: Key, defaultValue: State[Key], options: IOptions<State[Key], State> = {}): Register<State[Key], State> => {
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
                onChange: handleChange(name, 'boolean'),
                error: Boolean(errors[name]),
                disabled: options.disabled || false,
                helperText: options.helperText || errors[name],
                checked: definedOr(state[name], defaultValue),
            } : {
                name,
                onChange: handleChange(name, 'other'),
                error: Boolean(errors[name]),
                disabled: options.disabled || false,
                helperText: options.helperText || errors[name],
                value: definedOr(state[name], defaultValue),
            }
        return res as unknown as Register<State[typeof name], State>
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
        isAnyTouched,
        isChanged
    }
}

export default useMuiForm
