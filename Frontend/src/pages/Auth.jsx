import CssBaseline from "@mui/material/CssBaseline";
import Stack from "@mui/material/Stack";
import AppTheme from "../shared-theme/AppTheme";
import ColorModeSelect from "../shared-theme/ColorModeSelect";
import SignInCard from "../comp/SignInCard";
import SignUpCard from "../comp/SignUpCard";
import Content from "../comp/Content";
import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { showAppToast } from "../utils/appToast.jsx";

export default function Auth(props) {
  const [formState, setFormState] = useState(0);
  const { handleRegister, handleLogin } = useContext(AuthContext);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleAuth = async ({ name, username, password }) => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const authRequest =
        formState === 0
          ? handleLogin(username, password)
          : handleRegister(name, username, password);

      const [result] = await Promise.all([authRequest, wait(2500)]);

      if (formState === 0) {
        showAppToast("login");
      } else {
        showAppToast("signup");
      }

      navigate("/home");
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";

      setError(errorMessage);
      showAppToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <ColorModeSelect
          sx={{ position: "fixed", top: "1rem", right: "1rem" }}
        />
        <Stack
          direction="column"
          component="main"
          sx={[
            {
              justifyContent: "center",
              height: "calc((1 - var(--template-frame-height, 0)) * 100%)",
              marginTop: "max(40px - var(--template-frame-height, 0px), 0px)",
              minHeight: "100%",
            },
            (theme) => ({
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                zIndex: -1,
                inset: 0,
                backgroundImage:
                  "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
                backgroundRepeat: "no-repeat",
                ...theme.applyStyles("dark", {
                  backgroundImage:
                    "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
                }),
              },
            }),
          ]}
        >
          <Stack
            direction={{ xs: "column-reverse", md: "row" }}
            sx={{
              justifyContent: "center",
              gap: { xs: 6, sm: 12 },
              p: 2,
              mx: "auto",
            }}
          >
            <Stack
              direction={{ xs: "column-reverse", md: "row" }}
              sx={{
                justifyContent: "center",
                gap: { xs: 6, sm: 12 },
                p: { xs: 2, sm: 4 },
                m: "auto",
              }}
            >
              {formState === 1 && <Content />}

              {formState === 0 ? (
                <SignInCard
                  setFormState={setFormState}
                  handleAuth={handleAuth}
                  loading={loading}
                  error={error}
                />
              ) : (
                <SignUpCard
                  setFormState={setFormState}
                  handleAuth={handleAuth}
                  loading={loading}
                  error={error}
                />
              )}
            </Stack>
          </Stack>
        </Stack>
      </AppTheme>
    </div>
  );
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
