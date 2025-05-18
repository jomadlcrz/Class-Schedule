"use client";

import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./App.css";
import logo from "./assets/logo.png";

// Google OAuth client ID
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    // Preload images
    const preloadImages = async () => {
      const imagePromises = [
        new Promise((resolve, reject) => {
          const img = new Image();
          img.src = logo;
          img.onload = () => {
            // Store the loaded image in memory
            window.preloadedImages = window.preloadedImages || {};
            window.preloadedImages.logo = img.src;
            resolve();
          };
          img.onerror = reject;
        })
      ];

      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.error("Error preloading images:", error);
        setImagesLoaded(true); // Continue even if images fail to load
      }
    };

    preloadImages();
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = async () => {
      try {
        const loggedInUser = localStorage.getItem("user");
        if (loggedInUser) {
          const foundUser = JSON.parse(loggedInUser);
          // Verify token is still valid
          if (foundUser.token) {
            setUser(foundUser);
            setIsAuthenticated(true);
          } else {
            // If no token, clear invalid data
            localStorage.removeItem("user");
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Check login state immediately
    checkLoggedIn();

    // Track if this is a refresh
    const isRefreshing = sessionStorage.getItem('isRefreshing');
    if (!isRefreshing) {
      sessionStorage.setItem('isRefreshing', 'true');
    }

    // Handle page close
    const handleBeforeUnload = () => {
      // Only clear user data if this is not a refresh
      if (!sessionStorage.getItem('isRefreshing')) {
        localStorage.removeItem("user");
        sessionStorage.removeItem('isRefreshing');
      }
    };

    // Handle page load
    const handlePageLoad = () => {
      // If the page is being loaded and we have the closing flag, it means it was a refresh
      if (sessionStorage.getItem('isRefreshing')) {
        sessionStorage.removeItem('isRefreshing');
      } else {
        // If no closing flag, it means the page was closed and reopened
        localStorage.removeItem("user");
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handlePageLoad);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handlePageLoad);
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
  };

  if (isLoading || !imagesLoaded) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Router>
        <div className="App">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <Dashboard user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
