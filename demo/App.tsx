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
import { type FC, useState } from "react";
import JSONPretty from "react-json-pretty";
import "react-json-pretty/themes/monikai.css";
import { DateTimeField, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useMuiForm } from "@/src";

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

type DemoFormProps = {
  mode: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
};

const DemoForm: FC<DemoFormProps> = ({ mode }) => {
  const { registerMui, handleSubmit, watch } = useMuiForm<State>({
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
    mode,
  });

  const submit = async (data: State) => {
    // biome-ignore lint/suspicious/noConsole: demo logging
    console.log("data", data);
  };

  const birthProps = registerMui("birth", {
    required: true,
    validate: (_value) => {
      const year2000 = dayjs().year(2000);
      if (_value.isBefore(year2000)) {
        return "birth date must be after 2000";
      }
      return true;
    },
  });

  return (
    <Stack direction="row" spacing={2}>
      <Stack maxHeight={500} spacing={2}>
        <h1>Hello World</h1>
        <TextField
          label="name"
          variant="outlined"
          {...registerMui("person.name", { required: true })}
          defaultValue={"maks"}
        />

        <TextField
          label="email"
          type="email"
          variant="outlined"
          {...registerMui("email", {
            validate: (value) => {
              if (value.length < 5) {
                return "Email must be at least 5 characters long";
              }
              if (!value.includes("@")) {
                return "Email must contain @";
              }
              return;
            },
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
  );
};

const App: FC = () => {
  const [mode, setMode] = useState<DemoFormProps["mode"]>("onBlur");

  return (
    <Stack height="100%" alignItems="center" justifyContent="center" component={Paper} spacing={2} padding={2}>
      <TextField
        select
        label="Form Mode"
        value={mode}
        onChange={(e) => setMode(e.target.value as typeof mode)}
        variant="outlined"
        sx={{ width: 300 }}
      >
        <MenuItem value="onChange">onChange (Controlled)</MenuItem>
        <MenuItem value="onBlur">onBlur</MenuItem>
        <MenuItem value="onSubmit">onSubmit</MenuItem>
        <MenuItem value="onTouched">onTouched</MenuItem>
        <MenuItem value="all">all</MenuItem>
      </TextField>

      <DemoForm key={mode} mode={mode} />
    </Stack>
  );
};

export default App;
