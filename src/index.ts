import React, { ChangeEvent, useEffect, useMemo, useState, HTMLInputElement } from 'react'
import {useAtom, WritableAtom} from 'jotai'
import { RESET } from 'jotai/utils'
import { atomWithHash } from 'jotai-location'
import {IErrorState, InputType, IOptions, IState, IStateOptions, ITouchedState} from "./types";


const definedOr = <T, V>(value: T, other: V) => value === undefined ? other : value

const generateErrorState = (defaultState: IState): IErrorState => {
    const errorState: IErrorState = {}
    for (const key in defaultState) {
        errorState[key] = undefined
    }
    return errorState
}

const generateTouchedState = (defaultState: IState, flag: boolean = false): ITouchedState => {
    const touchedState: ITouchedState = {}
    for (const key in defaultState) {
        touchedState[key] = flag
    }
    return touchedState
}

const checkValid = (errors: IErrorState) => {
    for (const key in errors) {
        if (errors[key] !== undefined) {
            return false
        }
    }
    return true
}


const useMuiForm = <T extends IState = IState>(urlKey: string) => {
    const defaultState: T = {} as T
    const stateOptions: IStateOptions = {}

    const memoFunc = () => atomWithHash<T>(urlKey, defaultState, { replaceState: true })
    // get return value type
    type MemoReturnType = ReturnType<typeof memoFunc>
    const stateAtom: MemoReturnType = useMemo(memoFunc, [])

    const [state, setState] = useAtom(stateAtom)

    const [errors, setErrors] = useState<any>(generateErrorState(defaultState))
    const [touched, setTouched] = useState<any>(generateTouchedState(defaultState))

    const handleChange = (type: InputType) => (e: ChangeEvent<HTMLInputElement>) => {
        // update touched state to reflect user interaction
        setTouched((ps: any) => {
            return {
                ...ps,
                [e.target.name]: true,
            }
        })
        // update state to reflect user input
        const eventValue = type === InputType.CHECKBOX ? e.target.checked : e.target.value

        setState((ps: any) => {
            const cf = stateOptions[e.target.name].format
            return {
                ...ps,
                [e.target.name]: cf ? cf(eventValue as string) : eventValue,
            }
        })
    }

    const validate = (data: IState, checkTouched: boolean = true): IErrorState => {
        const newErrors: IErrorState = {}

        for (const key in defaultState) {

            if (stateOptions[key].disabled) continue
            if (!touched[key] && checkTouched) continue

            // check if field is required
            if (stateOptions[key].required && !data[key]) {
                newErrors[key] = 'Field is required'
                continue
            }

            const checkFunc = stateOptions[key].validate
            if (checkFunc !== undefined) {
                const res: string | true = checkFunc(data[key], data)
                newErrors[key] = res === true ? undefined : res
            }
        }
        return newErrors
    }

    useEffect(() => {
        setErrors(validate(state))
    }, [state])

    const register = (name: string, options: IOptions = { type: InputType.TEXT }) => {
        // @ts-ignore
        defaultState[name] = options.type === InputType.CHECKBOX ? definedOr(options.default, false) : definedOr(options.default, '')

        stateOptions[name] = {
            required: options.type === InputType.CHECKBOX ? false : definedOr(options.required, false),
            validate: options.validate,
            format: options.type !== InputType.CHECKBOX ? options.format : undefined,
            disabled: options.disabled,
        }
        let res: any = {
            name,
            onChange: handleChange(options.type || InputType.TEXT),
            error: Boolean(errors[name]),
            disabled: options.disabled || false,
            helperText: options.helperText || errors[name],
        }

        if (options.type === InputType.CHECKBOX) {
            res = {
                ...res,
                checked: definedOr(state[name], definedOr(options.default, false)),
            }
        } else {
            res = {
                ...res,
                value: definedOr(state[name], definedOr(options.default, '')),
            }
        }

        return res
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
        errors,
        register,
        forceValidate,
        clear,
    }
}

export default useMuiForm
