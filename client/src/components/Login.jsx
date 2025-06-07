import { useGoogleLogin } from "@react-oauth/google";
import logo from "../assets/logo.png";
import "../styles/Login.css";

function Login({ onLogin }) {
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Get user info using the access token
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then(res => res.json());

        const userData = {
          email: userInfo.email,
          name: userInfo.name,
          imageUrl: userInfo.picture,
          token: response.access_token,
        };
        
        onLogin(userData);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    },
    onError: () => {
      console.error("Login Failed");
    },
    flow: "implicit",
    scope: "email profile"
  });

  return (
    <div className="login-container">
      <div className="login-card">
        <img
          src={window.preloadedImages?.logo || logo}
          alt="GWC Logo"
          className="logo"
          style={{
            opacity: 1,
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            pointerEvents: "none",
          }}
        />
        <h1>Class Schedule System</h1>
        <p>
          Please sign in with your Google account to access your class schedule.
        </p>
        <div
          className="google-login-wrapper"
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          <button
            onClick={() => login()}
            className="custom-google-button"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              style={{ width: '18px', height: '18px' }}
            />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
