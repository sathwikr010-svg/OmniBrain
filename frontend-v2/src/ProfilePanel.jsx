import {
  UserRound,
  Mail,
  LogOut,
  X,
  Settings,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import { useMemo } from "react";

function ProfilePanel({
  onClose,
  onLogout,
  onSettings,
}) {
  // ============================================================
  // USER DATA
  // ============================================================

  const email =
    localStorage.getItem("user_email") ||
    "satwik@omnibrain.local";

  const username = useMemo(() => {
    const name =
      email
        .split("@")[0]
        ?.replace(/[._-]+/g, " ")
        .trim();

    if (!name) {
      return "Satwik";
    }

    return name
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }, [email]);

  const initial =
    username.charAt(0).toUpperCase();

  // ============================================================
  // CLOSE ON ESCAPE
  // ============================================================

  useMemo(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  // ============================================================
  // SETTINGS
  // ============================================================

  const handleSettings = () => {
    if (onSettings) {
      onSettings();
    }

    onClose?.();
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to sign out of OmniBrain?"
      );

    if (!confirmed) {
      return;
    }

    onLogout?.();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      {/* ======================================================
          PROFILE CARD
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          right: "25px",
          top: "68px",
          width: "320px",
          maxWidth:
            "calc(100vw - 40px)",
          background: "#ffffff",
          border:
            "1px solid #e5eaf1",
          borderRadius: "14px",
          boxShadow:
            "0 18px 55px rgba(15,23,42,.16)",
          overflow: "hidden",
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            padding:
              "16px 18px",
            borderBottom:
              "1px solid #f0f2f5",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <UserRound
              size={17}
              color="#2879df"
            />

            <strong
              style={{
                color: "#17243c",
                fontSize: "14px",
              }}
            >
              Profile
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            style={{
              border: "none",
              background:
                "transparent",
              color: "#8994a6",
              cursor: "pointer",
              width: "30px",
              height: "30px",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* ==================================================
            USER INFORMATION
        ================================================== */}

        <div
          style={{
            padding: "20px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* AVATAR */}

            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #1677df, #4c9aff)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                fontSize: "20px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initial}
            </div>

            {/* NAME */}

            <div
              style={{
                minWidth: 0,
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#17243c",
                  fontSize: "15px",
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace:
                    "nowrap",
                }}
              >
                {username}
              </strong>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  marginTop: "5px",
                  color: "#8994a6",
                  fontSize: "10px",
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace:
                    "nowrap",
                  maxWidth: "210px",
                }}
              >
                <Mail size={12} />
                {email}
              </span>
            </div>
          </div>

          {/* ==================================================
              ACCOUNT STATUS
          ================================================== */}

          <div
            style={{
              marginTop: "18px",
              padding: "11px 12px",
              background: "#f0fdf7",
              border:
                "1px solid #d4f4e5",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <ShieldCheck
              size={17}
              color="#20a77d"
            />

            <div>
              <strong
                style={{
                  display: "block",
                  color: "#19795f",
                  fontSize: "11px",
                }}
              >
                Account Active
              </strong>

              <span
                style={{
                  display: "block",
                  color: "#6b8d82",
                  fontSize: "9px",
                  marginTop: "2px",
                }}
              >
                Secure OmniBrain session
              </span>
            </div>

            <span
              style={{
                marginLeft: "auto",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#20a77d",
              }}
            />
          </div>
        </div>

        {/* ==================================================
            MENU
        ================================================== */}

        <div
          style={{
            borderTop:
              "1px solid #f0f2f5",
            padding: "8px",
          }}
        >
          {/* SETTINGS */}

          <button
            type="button"
            onClick={
              handleSettings
            }
            style={{
              width: "100%",
              border: "none",
              background:
                "transparent",
              borderRadius: "9px",
              padding:
                "11px 10px",
              display: "flex",
              alignItems: "center",
              gap: "11px",
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(
              event
            ) => {
              event.currentTarget.style.background =
                "#f6f9fc";
            }}
            onMouseLeave={(
              event
            ) => {
              event.currentTarget.style.background =
                "transparent";
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                background:
                  "#edf6ff",
                color: "#2879df",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
              }}
            >
              <Settings
                size={17}
              />
            </div>

            <div
              style={{
                flex: 1,
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#263249",
                  fontSize: "11px",
                }}
              >
                Settings
              </strong>

              <span
                style={{
                  display: "block",
                  color: "#8994a6",
                  fontSize: "9px",
                  marginTop: "2px",
                }}
              >
                Manage workspace preferences
              </span>
            </div>

            <ChevronRight
              size={15}
              color="#9aa5b5"
            />
          </button>

          {/* ==================================================
              SIGN OUT
          ================================================== */}

          <button
            type="button"
            onClick={
              handleLogout
            }
            style={{
              width: "100%",
              marginTop: "4px",
              height: "40px",
              border:
                "1px solid #f0d5d5",
              background:
                "#fff7f7",
              color: "#d9534f",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              gap: "7px",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <LogOut size={15} />

            Sign out
          </button>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div
          style={{
            padding:
              "10px 18px 13px",
            textAlign: "center",
            color: "#a0a9b7",
            fontSize: "9px",
          }}
        >
          OmniBrain Intelligence Platform
        </div>
      </div>
    </div>
  );
}

export default ProfilePanel;