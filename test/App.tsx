import {FC, useEffect} from "react";
import {Button, Checkbox, FormControlLabel, MenuItem, Paper, Select, Stack, TextField} from "@mui/material";
import useMuiForm from "../src";
import {ValidateFunc} from "../src/types";
import {DateTimeField} from '@mui/x-date-pickers/DateTimeField'
import {LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import * as dayjs from 'dayjs'

type State = {
    email: string
    role: 'root' | 'admin' | 'developer' | 'user' | 'guest'
    racoon: boolean
    birth: dayjs.Dayjs
}

const App: FC = () => {
    const {state, register, forceValidate, clear, setState} = useMuiForm<State>()

    useEffect(() => {
        console.log('state', state)
    }, [state])

    const submit = () => {
        if (forceValidate()) {
            console.log('submit', state)
            clear()
        }
    }

    const alterState = () => {
        setState(ps => ({
            ...ps,
            email: 'have-changed@gmail.com'
        }))
    }

    const emailValidator: ValidateFunc<string, State> = (value) => {
        if (value.length < 5) {
            return 'Email must be at least 5 characters long'
        }
        // @ts-ignore
        if (!value.includes('@')) {
            return 'Email must contain @'
        }
        return true
    }

    const birthProps = register(
        'birth',
        dayjs(),
        {
            required: true,
            validate: (value, state) => {
                // get value of year 2000
                const year2000 = dayjs().year(2000)
                if (value.isBefore(year2000)) {
                    return 'birth date must be after 2000'
                }
                return true
            },
        },
    )

    const checkBoxProps =register('racoon', false, {})

    return <Stack height='100%' alignItems='center' justifyContent='center' component={Paper}>
        <Stack maxHeight={500} spacing={2}>
            <h1>Hello World</h1>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimeField
                    label='birth'
                    {...birthProps}
                />
            </LocalizationProvider>
            <TextField
                label='email'
                type='email'
                variant='outlined'
                {...register('email', 'test@root.com', { required: true, validate: emailValidator })}
                fullWidth
            />
            <TextField
                select
                label='role'
                variant='outlined'
                {...register('role', 'root',{})}
                fullWidth
            >
                {
                    ['root', 'admin', 'developer', 'user', 'guest'].map(role =>
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                    )
                }
            </TextField>
            <FormControlLabel
                label="Are you a racoon?"
                control={
                    <Checkbox
                        checked={checkBoxProps.checked}
                        onChange={checkBoxProps.onChange}
                    />
                }
            />
            <Button variant='contained' color='warning' onClick={alterState}>
               CHANGE STATE
            </Button>
            <Button variant='contained' color='secondary' onClick={clear}>
                RESET
            </Button>
            <Button variant='contained' onClick={submit}>
                SUBMIT
            </Button>
        </Stack>

    </Stack>
}

export default App
