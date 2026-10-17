import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiCard from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { GoogleIcon } from "./CustomIcons";
import { ClipLoader } from "react-spinners";
import { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

export default function SignIn({ setFormState, handleAuth, loading, error }) {
  const [userName, setUserName] = useState();
  const [password, setPassword] = useState();

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState("");

  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");

  const { handleLogin } = useContext(AuthContext);

  const validateInputs = () => {
    const username = document.getElementById("signin-username");
    const password = document.getElementById("signin-password");

    let isValid = true;

    // Username validation
    if (!username.value || username.value.length < 3) {
      setUsernameError(true);
      setUsernameErrorMessage("Username must be at least 3 characters long.");
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage("");
    }

    // Password validation
    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!validateInputs()) {
      return;
    }

    const data = new FormData(event.currentTarget);

    await handleAuth({
      username: data.get("username"),
      password: data.get("password"),
    });
  };

  return (
    <Card variant="outlined">
      <Typography
        component="h1"
        variant="h4"
        sx={{
          width: "100%",
          fontSize: "clamp(2rem, 10vw, 2.15rem)",
        }}
      >
        Sign in
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          gap: 2,
        }}
      >
        <FormControl>
          <FormLabel htmlFor="signin-username">Username</FormLabel>

          <TextField
            error={usernameError}
            helperText={usernameErrorMessage}
            id="signin-username"
            type="text"
            name="username"
            placeholder="Enter your username"
            autoComplete="username"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={usernameError ? "error" : "primary"}
            onChange={(e) => setUserName(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="signin-password">Password</FormLabel>

          <TextField
            error={passwordError}
            helperText={passwordErrorMessage}
            id="signin-password"
            name="password"
            placeholder="••••••"
            type="password"
            autoComplete="current-password"
            required
            fullWidth
            variant="outlined"
            color={passwordError ? "error" : "primary"}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <Button type="submit" fullWidth variant="contained" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <ClipLoader size={18} color="black" />
              Logging in...
            </span>
          ) : (
            "Sign in"
          )}
        </Button>

        <Typography sx={{ textAlign: "center" }}>
          Don't have an account?{" "}
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => setFormState(1)}
          >
            Sign up
          </Link>
        </Typography>
      </Box>

      <Divider>or</Divider>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            window.location.href = "http://localhost:5000/auth/google";
          }}
          startIcon={<GoogleIcon />}
        >
          Sign in with Google
        </Button>
      </Box>
    </Card>
  );
}
