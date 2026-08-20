import { useState } from "react";

import {
  Eye,
  EyeOff,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
  Activity,
  BarChart3,
  Bot,
} from "lucide-react";

import "./App.css";

import Dashboard from "./Dashboard";
import Signup from "./Signup";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  // ============================================================
  // AUTHENTICATION STATE
  // ============================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [email, setEmail] =
    useState(
      localStorage.getItem("remembered_email") || ""
    );

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(
      !!localStorage.getItem("remembered_email")
    );

  const [loggedin, setLoggedin] =
    useState(
      !!localStorage.getItem("access_token")
    );

  const [showSignup, setShowSignup] =
    useState(false);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!email.trim()) {
      alert("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      alert("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------------
      // API REQUEST
      // --------------------------------------------------------

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      // --------------------------------------------------------
      // READ RESPONSE SAFELY
      // --------------------------------------------------------

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      // --------------------------------------------------------
      // API ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Invalid email or password."
        );
      }

      // --------------------------------------------------------
      // TOKEN VALIDATION
      // --------------------------------------------------------

      if (!data?.access_token) {
        throw new Error(
          "Login succeeded, but no access token was returned."
        );
      }

      // --------------------------------------------------------
      // SAVE AUTHENTICATION
      // --------------------------------------------------------

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      localStorage.setItem(
        "user_email",
        email.trim()
      );

      // --------------------------------------------------------
      // REMEMBER EMAIL
      // --------------------------------------------------------

      if (rememberMe) {
        localStorage.setItem(
          "remembered_email",
          email.trim()
        );
      } else {
        localStorage.removeItem(
          "remembered_email"
        );
      }

      // --------------------------------------------------------
      // CLEAR PASSWORD
      // --------------------------------------------------------

      setPassword("");

      // --------------------------------------------------------
      // OPEN DASHBOARD
      // --------------------------------------------------------

      setLoggedin(true);

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      alert(
        error?.message ||
          "Unable to connect to OmniBrain. Please make sure the FastAPI backend is running."
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SIGN UP â†’ LOGIN
  // ============================================================

  const handleSignupSuccess = () => {
    setShowSignup(false);

    setPassword("");

    /*
      Keep the email if Signup stores it.
      The user can then login normally.
    */
  };

  // ============================================================
  // SHOW SIGN UP PAGE
  // ============================================================

  if (showSignup) {
    return (
      <Signup
        onBackToLogin={() =>
          setShowSignup(false)
        }
        onSignupSuccess={
          handleSignupSuccess
        }
      />
    );
  }

  // ============================================================
  // SHOW DASHBOARD AFTER LOGIN
  // ============================================================

  if (loggedin) {
    return <Dashboard />;
  }

  // ============================================================
  // LOGIN PAGE
  // ============================================================

  return (
    <div className="app">

      {/* ======================================================
          BACKGROUND
          ====================================================== */}

      <div className="background-grid"></div>

      {/* ======================================================
          TOP NAVIGATION
          ====================================================== */}

      <header className="topbar">

        {/* BRAND */}

        <div className="brand">

          <div className="brand-icon">
            <BrainCircuit size={26} />
          </div>

          <div>
            <h2>OmniBrain</h2>

            <span>
              Industrial Intelligence Platform
            </span>
          </div>

        </div>

        {/* SECURITY */}

        <div className="secure-badge">

          <ShieldCheck size={17} />

          Secure Environment

        </div>

      </header>

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <main className="login-layout">

        {/* ====================================================
            LEFT HERO SECTION
            ==================================================== */}

        <section className="hero">

          {/* SYSTEM STATUS */}

          <div className="status">

            <span className="status-dot"></span>

            AI SYSTEM ONLINE

          </div>

          {/* MAIN HEADING */}

          <h1>
            Intelligence that
            <br />

            <span>
              works for you.
            </span>
          </h1>

          {/* DESCRIPTION */}

          <p>
            OmniBrain brings intelligent AI agents,
            industrial monitoring, analytics and
            decision support into one powerful
            workspace.
          </p>

          {/* ==================================================
              FEATURE CARDS
              ================================================== */}

          <div className="feature-row">

            {/* MONITORING */}

            <div className="feature-item">

              <div className="feature-icon">

                <Activity size={20} />

              </div>

              <div>

                <strong>
                  24/7
                </strong>

                <small>
                  Monitoring
                </small>

              </div>

            </div>

            {/* AI */}

            <div className="feature-item">

              <div className="feature-icon">

                <Bot size={20} />

              </div>

              <div>

                <strong>
                  AI
                </strong>

                <small>
                  Multi-Agent
                </small>

              </div>

            </div>

            {/* ANALYTICS */}

            <div className="feature-item">

              <div className="feature-icon">

                <BarChart3 size={20} />

              </div>

              <div>

                <strong>
                  Live
                </strong>

                <small>
                  Analytics
                </small>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            LOGIN CARD
            ==================================================== */}

        <section className="login-card">

          {/* CARD HEADER */}

          <div className="card-header">

            <div className="mini-logo">

              <BrainCircuit size={23} />

            </div>

            <div>

              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to your OmniBrain workspace
              </p>

            </div>

          </div>

          {/* ==================================================
              LOGIN FORM
              ================================================== */}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}

            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              autoComplete="email"
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={loading}
            />

            {/* PASSWORD */}

            <label htmlFor="password">
              Password
            </label>

            <div className="password-box">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                disabled={loading}
              />

              {/* SHOW / HIDE PASSWORD */}

              <button
                type="button"
                className="eye-button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}

              </button>

            </div>

            {/* =================================================
                OPTIONS
                ================================================= */}

            <div className="form-options">

              {/* REMEMBER ME */}

              <label className="remember">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                  disabled={loading}
                />

                Remember me

              </label>

              {/* FORGOT PASSWORD */}

              <button
                type="button"
                className="forgot"
                onClick={() =>
                  alert(
                    "Password recovery will be available soon."
                  )
                }
                disabled={loading}
              >
                Forgot password?
              </button>

            </div>

            {/* =================================================
                LOGIN BUTTON
                ================================================= */}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="login-spinner"></span>

                  Authenticating...
                </>
              ) : (
                <>
                  Sign in

                  <ArrowRight
                    size={19}
                  />
                </>
              )}

            </button>

          </form>

          {/* ==================================================
              SECURITY MESSAGE
              ================================================== */}

          <div className="card-footer">

            <ShieldCheck size={16} />

            Your connection is protected

          </div>

          {/* ==================================================
              SIGN UP
              ================================================== */}

          <div className="signup-link">

            <span>
              New to OmniBrain?
            </span>

            <button
              type="button"
              onClick={() =>
                setShowSignup(true)
              }
              disabled={loading}
            >
              Create account

              <ArrowRight
                size={15}
              />

            </button>

          </div>

        </section>

      </main>

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer>

        <span>
          Â© 2026 OmniBrain
        </span>

        <span>
          Industrial Multi-Agent AI Platform
        </span>

      </footer>

    </div>
  );
}

export default App;

