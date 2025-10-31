import { Button, Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";
import { useMuiForm } from "usemuiform";

// #region setup
type FormState = {
  email: string;
  role: "root" | "admin" | "developer" | "user" | "guest" | "";
  isActive: boolean;
};

export default function MyForm() {
  const { state, register, forceValidate, clear } = useMuiForm<FormState>({
    defaultValues: { email: "", role: "", isActive: false },
  });
  // #endregion setup

  // #region submit
  const submit = () => {
    if (forceValidate()) {
      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.log("Form data:", state);
      clear();
    }
  };
  // #endregion submit

  return (
    <div>
      {/* #region textfield */}
      <TextField label="Email" type="email" variant="outlined" {...register("email", { required: true })} fullWidth />
      {/* #endregion textfield */}

      {/* #region select */}
      <TextField select label="Role" variant="outlined" {...register("role")} fullWidth>
        {["root", "admin", "developer", "user", "guest"].map((role) => (
          <MenuItem key={role} value={role}>
            {role}
          </MenuItem>
        ))}
      </TextField>
      {/* #endregion select */}

      {/* #region checkbox */}
      <FormControlLabel label="Is Active" control={<Checkbox {...register("isActive")} />} />
      {/* #endregion checkbox */}

      {/* #region button */}
      <Button variant="contained" onClick={submit}>
        SUBMIT
      </Button>
      {/* #endregion button */}
    </div>
  );
}
