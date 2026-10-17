import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/home");
    } else {
      navigate("/");
    }
  }, [navigate, searchParams]);

  return <div>Signing you in...</div>;
}
