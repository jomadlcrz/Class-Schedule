import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import logo from "../assets/logo.png";
import "../styles/Login.css";
import { useRef } from "react";

function Login({ onLogin }) {
  const googleLoginRef = useRef();
  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const userData = {
      email: decoded.email,
      name: decoded.name,
      imageUrl: decoded.picture,
      token: credentialResponse.credential,
    };
    onLogin(userData);
  };

  const handleError = () => {
    console.error("Login Failed");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo || "/placeholder.svg"} alt="GWC Logo" className="logo" />
        <h1>Welcome to Class Schedule</h1>
        <p>
          Please sign in to manage your class schedule
        </p>
        <div className="google-login-wrapper">
          <button
            className="custom-google-btn"
            onClick={() => googleLoginRef.current.querySelector('div').click()}
            type="button"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google icon" className="google-icon" />
            <span>Sign in with Google</span>
          </button>
          <div ref={googleLoginRef} style={{ display: 'none' }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap
              type="icon"
              shape="circle"
              size="large"
              logo_alignment="center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
