import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const navigate = useNavigate();
    const isAuth = Boolean(localStorage.getItem("token"));

    useEffect(() => {
      if (!isAuth) {
        navigate("/auth", { replace: true });
      }
    }, [isAuth, navigate]);

    if (!isAuth) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
