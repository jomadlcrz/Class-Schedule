import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import logo from "../assets/logo.png";
import "../styles/Login.css";

function Login({ onLogin }) {
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
        <img 
          src={window.preloadedImages?.logo || logo} 
          alt="GWC Logo" 
          className="logo"
          style={{ 
            opacity: 1,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            pointerEvents: 'none'
          }}
        />
        <h1>Class Schedule System</h1>
        <p>
          Please sign in with your Google account to access your class schedule.
        </p>
        <div className="google-login-wrapper" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
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
  );
}

export default Login;