import {FC} from "react";
import {Button, Checkbox, FormControlLabel, MenuItem, Paper, Select, Stack, TextField} from "@mui/material";
import useMuiForm from "../src";
import {ValidateFunc} from "../src/types";

type State = {
    email: string
    role: 'root' | 'admin' | 'developer' | 'user' | 'guest'
    secondRole: 'root' | 'admin' | 'developer' | 'user' | 'guest'
    racoon: boolean
}

const App: FC = () => {
    const {state, register, forceValidate, clear} = useMuiForm<State>('login')

    const submit = () => {
        if (forceValidate()) {
            console.log('submit', state)
            clear()
        }
    }

    const emailValidator: ValidateFunc<string, State> = (value) => {
        if (value.length < 5) {
            return 'Email must be at least 5 characters long'
        }
        if (!value.includes('@')) {
            return 'Email must contain @'
        }
        return true
    }

    return <Stack height='100%' alignItems='center' justifyContent='center' component={Paper}>
        <Stack maxHeight={500} spacing={2}>
            <h1>Hello World</h1>
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
            <Select
                label='role'
                variant='outlined'
                {...register('secondRole', 'root',{})}
                fullWidth
            >
                {
                    ['root', 'admin', 'developer', 'user', 'guest'].map(role =>
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                    )
                }
            </Select>
            <FormControlLabel
                label="Are you a racoon?"
                control={
                    <Checkbox
                        {...register('racoon', false, {})}
                    />
                }
            />
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
