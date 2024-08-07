import {FC, useState} from "react";
import {
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    MenuItem,
    Paper,
    Stack,
    TextField
} from "@mui/material";
import useMuiForm from "../src";
import {ValidateFunc} from "@/src/types";
import {DateTimeField} from '@mui/x-date-pickers/DateTimeField'
import {LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import JSONPretty from 'react-json-pretty'
import 'react-json-pretty/themes/monikai.css'

type State = {
    email: string
    role: 'root' | 'admin' | 'developer' | 'user' | 'guest' | ''
    racoon: boolean
    birth: dayjs.Dayjs
}

const App: FC = () => {
    const {state, register, forceValidate, clear, setState} = useMuiForm<State>()
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        if (submitting) return
        if (forceValidate()) {
            console.log('setting true')
            setSubmitting(true)
            // wait 1 second
            await new Promise(resolve => setTimeout(resolve, 1000))
            setSubmitting(false)
        }
    }

    const alterState = () => {
        setState(ps => ({
            ...ps,
            email: 'have-changed@gmail.com'
        }))
    }

    const emailValidator: ValidateFunc<State['email'], State> = (value) => {
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
            validate: (value) => {
                // get value of year 2000
                const year2000 = dayjs().year(2000)
                if (value.isBefore(year2000)) {
                    return 'birth date must be after 2000'
                }
                return true
            },
        },
    )

    const {
        helperText: checkboxHelperText,
        error: checkboxError,
        ...checkBoxProps
    } = register('racoon', false, {required: false})

    return <Stack height='100%' alignItems='center' justifyContent='center' component={Paper}>
        <Stack direction='row' spacing={2}>
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
                    {...register('email', '', {required: true, validate: emailValidator})}
                    fullWidth
                />
                <TextField
                    select
                    label='role'
                    variant='outlined'
                    {...register('role', '')}
                    fullWidth
                >
                    {
                        ['root', 'admin', 'developer', 'user', 'guest'].map(role =>
                            <MenuItem key={role} value={role}>{role}</MenuItem>
                        )
                    }
                </TextField>
                <FormGroup>
                    <FormControlLabel
                        label="Are you a racoon?"
                        control={
                            <Checkbox
                                {...checkBoxProps}
                            />
                        }
                    />
                    <FormHelperText error={checkboxError}>{checkboxHelperText}</FormHelperText>
                </FormGroup>
                <Button variant='contained' color='warning' onClick={alterState}>
                    CHANGE STATE
                </Button>
                <Button variant='contained' color='secondary' onClick={clear}>
                    RESET
                </Button>
                <Button variant='contained' onClick={submit} disabled={submitting}>
                    {
                        submitting
                            ? <Stack sx={{color: 'black'}}><CircularProgress color='inherit' size={24}/> </Stack>
                            : 'SUBMIT'
                    }
                </Button>
            </Stack>
            <JSONPretty data={state}/>
        </Stack>
    </Stack>
}

export default App
