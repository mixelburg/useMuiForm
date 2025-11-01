import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import type { FC } from "react";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";
import { DateTimeField, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { get } from "lodash";
import { type FieldValues, type Path, type UseFormProps, useForm } from "react-hook-form";

type RegisterMuiReturn = {
  name: string;
  onChange: (event: any) => void;
  onBlur: (event: any) => void;
  ref: (instance: any) => void;
  value?: any;
  checked?: boolean;
  error: boolean;
  helperText: string;
  inputRef: (instance: any) => void;
};

export function useMuiForm<TFieldValues extends FieldValues = FieldValues>(options?: UseFormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>(options);
  const {
    register,
    formState: { errors },
    watch,
  } = methods;

  function registerMui<Name extends Path<TFieldValues>>(
    name: Name,
    options?: Parameters<typeof register>[1],
  ): RegisterMuiReturn {
    const field = register(name, options);
    const err = get(errors, name);
    const value = watch(name);

    // Check if this is a checkbox field (value is boolean)
    const isCheckbox = typeof value === "boolean";

    return {
      ...field,
      ...(isCheckbox ? { checked: value } : { value: value ?? "" }),
      error: !!err,
      helperText: (err?.message as string) || "",
      inputRef: field.ref,
    };
  }

  return { ...methods, registerMui };
}

type Role = "root" | "admin" | "developer" | "user" | "guest" | "";
type State = {
  email: string;
  role: Role;
  roles: Role[];
  racoon: boolean;
  birth: dayjs.Dayjs;
  person: {
    name: string;
  };
  description: string;
};

const App: FC = () => {
  const { registerMui, handleSubmit, getValues, watch } = useMuiForm<State>({
    defaultValues: {
      roles: [],
      email: "",
      role: "root",
      racoon: true,
      birth: dayjs(),
      person: {
        name: "ivan",
      },
      description: "",
    },
    mode: "onChange",
  });

  const submit = async (_data: State) => {};

  const emailValidator = (value) => {
    if (value.length < 5) {
      return "Email must be at least 5 characters long";
    }
    if (!value.includes("@")) {
      return "Email must contain @";
    }
    return;
  };

  const birthProps = registerMui("birth", {
    required: true,
    validate: (_value) => {
      // const year2000 = dayjs().year(2000);
      // if (value.isBefore(year2000)) {
      //   return "birth date must be after 2000";
      // }
      return true;
    },
  });

  return (
    <Stack height="100%" alignItems="center" justifyContent="center" component={Paper}>
      <Stack direction="row" spacing={2}>
        <Stack maxHeight={500} spacing={2}>
          <h1>Hello World</h1>

          <TextField label="name" variant="outlined" {...registerMui("person.name")} />
          <TextField
            label="email"
            type="email"
            variant="outlined"
            {...registerMui("email", {
              validate: emailValidator,
            })}
            fullWidth
          />

          <TextField label="description" variant="outlined" {...registerMui("description", {})} fullWidth />

          <TextField select label="role" variant="outlined" {...registerMui("role")} fullWidth>
            {["root", "admin", "developer", "user", "guest"].map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>

          <Select multiple label="roles" variant="outlined" {...registerMui("roles")} fullWidth>
            {["root", "admin", "developer", "user", "guest"].map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>

          <FormGroup>
            {(() => {
              const { helperText, error, ...checkboxProps } = registerMui("racoon");
              return (
                <>
                  <FormControlLabel label="Are you a racoon?" control={<Checkbox {...checkboxProps} />} />
                  <FormHelperText error={error}>{helperText}</FormHelperText>
                </>
              );
            })()}
          </FormGroup>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimeField label="birth" {...birthProps} />
          </LocalizationProvider>

          <Button variant="contained" onClick={handleSubmit(submit)}>
            "SUBMIT"
          </Button>
        </Stack>
        <JSONPretty data={watch()} />
      </Stack>
    </Stack>
  );
};

export default App;
