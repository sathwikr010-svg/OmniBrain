import { useState } from "react";
import {
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react";

import "./Signup.css";

const API_URL = import.meta.env.VITE_API_URL;

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: cleanUsername,
            email: cleanEmail,
            password,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to create your account."
        );
      }

      setSuccess(
        "Account created successfully. Redirecting to sign in..."
      );

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="signup-background">

        <div className="signup-grid" />

        <div className="signup-glow signup-glow-one" />

        <div className="signup-glow signup-glow-two" />

      </div>


      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="signup-topbar">

        <div className="signup-brand">

          <div className="signup-brand-icon">
            <BrainCircuit size={24} />
          </div>

          <div>
            <strong>OmniBrain</strong>

            <span>
              Intelligence Platform
            </span>
          </div>

        </div>


        <div className="signup-secure">

          <ShieldCheck size={15} />

          <span>
            Secure Environment
          </span>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="signup-main">

        {/* ===================================================
            LEFT INTRO
        =================================================== */}

        <section className="signup-intro">

          <div className="signup-status">

            <span />

            AI SYSTEM ONLINE

          </div>


          <h1>

            <span className="signup-blue-text">
              Build your
            </span>

            <br />

            <span className="signup-white-text">
              intelligent workspace.
            </span>

          </h1>


          <p>
            Create your OmniBrain account and
            connect to intelligent AI agents,
            industrial monitoring, analytics and
            decision support.
          </p>


          {/* FEATURES */}

          <div className="signup-features">

            <div className="signup-feature">

              <div className="signup-feature-icon">
                <BrainCircuit size={17} />
              </div>

              <div>
                <strong>AI</strong>

                <span>
                  Multi-Agent
                </span>
              </div>

            </div>


            <div className="signup-feature">

              <div className="signup-feature-icon">
                <ShieldCheck size={17} />
              </div>

              <div>
                <strong>24/7</strong>

                <span>
                  Monitoring
                </span>
              </div>

            </div>


            <div className="signup-feature">

              <div className="signup-feature-icon">
                <ArrowRight size={17} />
              </div>

              <div>
                <strong>Live</strong>

                <span>
                  Analytics
                </span>
              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            SIGNUP CARD
        =================================================== */}

        <section className="signup-card">

          {/* CARD HEADER */}

          <div className="signup-card-header">

            <div className="signup-card-icon">
              <UserRound size={22} />
            </div>

            <div>

              <span className="signup-eyebrow">
                OMNIBRAIN
              </span>

              <h2>
                Create your account
              </h2>

              <p>
                Join your intelligent workspace.
              </p>

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <div className="signup-message signup-error">
              {error}
            </div>

          )}


          {/* SUCCESS */}

          {success && (

            <div className="signup-message signup-success">
              {success}
            </div>

          )}


          {/* FORM */}

          <form onSubmit={handleSignup}>

            {/* FULL NAME */}

            <div className="signup-field">

              <label htmlFor="signup-name">
                Full Name
              </label>

              <div className="signup-input">

                <UserRound size={17} />

                <input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  autoComplete="name"
                  disabled={loading}
                />

              </div>

            </div>


            {/* EMAIL */}

            <div className="signup-field">

              <label htmlFor="signup-email">
                Email Address
              </label>

              <div className="signup-input">

                <Mail size={17} />

                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="signup-field">

              <label htmlFor="signup-password">
                Password
              </label>

              <div className="signup-input">

                <Lock size={17} />

                <input
                  id="signup-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="signup-eye"
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
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="signup-field">

              <label htmlFor="signup-confirm-password">
                Confirm Password
              </label>

              <div className="signup-input">

                <Lock size={17} />

                <input
                  id="signup-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="signup-eye"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>

              </div>

            </div>


            {/* TERMS */}

            <label className="signup-terms">

              <input
                type="checkbox"
                required
                disabled={loading}
              />

              <span>
                I agree to the OmniBrain
                workspace terms and privacy
                policy.
              </span>

            </label>


            {/* SUBMIT */}

            <button
              type="submit"
              className="signup-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="signup-spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={17} />
                </>
              )}

            </button>

          </form>


          {/* LOGIN */}

          <div className="signup-login">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                (window.location.href = "/")
              }
              disabled={loading}
            >
              Sign in
            </button>

          </div>


          {/* SECURITY */}

          <div className="signup-security">

            <ShieldCheck size={15} />

            <span>
              Your connection is protected
            </span>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="signup-footer">

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

export default Signup;

