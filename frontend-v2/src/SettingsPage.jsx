import { useEffect, useState } from "react";

import {
  Settings,
  Bell,
  ShieldCheck,
  RefreshCw,
  Save,
  RotateCcw,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  notifications: true,
  autoRefresh: true,
  refreshInterval: 30,
};

function SettingsPage() {
  const [notifications, setNotifications] = useState(
    DEFAULT_SETTINGS.notifications
  );

  const [autoRefresh, setAutoRefresh] = useState(
    DEFAULT_SETTINGS.autoRefresh
  );

  const [refreshInterval, setRefreshInterval] = useState(
    DEFAULT_SETTINGS.refreshInterval
  );

  const [saved, setSaved] = useState(false);

  // ============================================================
  // LOAD SETTINGS
  // ============================================================

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        "omnibrain_settings"
      );

      if (!stored) {
        return;
      }

      const settings = JSON.parse(stored);

      setNotifications(
        settings.notifications ??
          DEFAULT_SETTINGS.notifications
      );

      setAutoRefresh(
        settings.autoRefresh ??
          DEFAULT_SETTINGS.autoRefresh
      );

      setRefreshInterval(
        Number(
          settings.refreshInterval ??
            DEFAULT_SETTINGS.refreshInterval
        )
      );
    } catch (error) {
      console.error(
        "Unable to load OmniBrain settings:",
        error
      );
    }
  }, []);

  // ============================================================
  // SAVE SETTINGS
  // ============================================================

  const saveSettings = () => {
    const settings = {
      notifications,
      autoRefresh,
      refreshInterval: Number(refreshInterval),
    };

    localStorage.setItem(
      "omnibrain_settings",
      JSON.stringify(settings)
    );

    window.dispatchEvent(
      new CustomEvent(
        "omnibrain-settings-changed",
        {
          detail: settings,
        }
      )
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  // ============================================================
  // RESET SETTINGS
  // ============================================================

  const resetSettings = () => {
    setNotifications(
      DEFAULT_SETTINGS.notifications
    );

    setAutoRefresh(
      DEFAULT_SETTINGS.autoRefresh
    );

    setRefreshInterval(
      DEFAULT_SETTINGS.refreshInterval
    );

    localStorage.setItem(
      "omnibrain_settings",
      JSON.stringify(
        DEFAULT_SETTINGS
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        "omnibrain-settings-changed",
        {
          detail: DEFAULT_SETTINGS,
        }
      )
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  // ============================================================
  // TOGGLE COMPONENT
  // ============================================================

  const Toggle = ({
    value,
    onChange,
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      style={{
        width: "46px",
        height: "25px",
        border: 0,
        borderRadius: "20px",
        background: value
          ? "#1677df"
          : "#cbd5e1",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition:
          "background 0.2s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          width: "19px",
          height: "19px",
          borderRadius: "50%",
          background: "#fff",
          top: "3px",
          left: value
            ? "24px"
            : "3px",
          transition:
            "left 0.2s ease",
          boxShadow:
            "0 1px 3px rgba(0,0,0,.15)",
        }}
      />
    </button>
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="ob-header">

        <div>

          <div className="ob-breadcrumb">

            <span>
              System
            </span>

            <b>
              /
            </b>

            <strong>
              Settings
            </strong>

          </div>

          <h1>
            System Settings
          </h1>

          <p>
            Configure your OmniBrain
            workspace preferences.
          </p>

        </div>

      </div>


      {/* ======================================================
          SETTINGS CARD
          ====================================================== */}

      <div
        style={{
          maxWidth: "820px",
          background: "#fff",
          border:
            "1px solid #e7ecf2",
          borderRadius: "14px",
          padding: "25px",
          boxShadow:
            "0 4px 15px rgba(31,52,77,.035)",
        }}
      >

        {/* ====================================================
            TITLE
        ==================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >

          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#edf6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >

            <Settings
              size={21}
              color="#2879df"
            />

          </div>

          <div>

            <h2
              style={{
                margin: 0,
                fontSize: "17px",
                color: "#17243c",
              }}
            >
              General Preferences
            </h2>

            <p
              style={{
                margin:
                  "4px 0 0",
                color: "#8994a6",
                fontSize: "11px",
              }}
            >
              Manage how OmniBrain behaves
              in your workspace.
            </p>

          </div>

        </div>


        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "20px 0",
            borderBottom:
              "1px solid #f0f2f5",
          }}
        >

          <Bell
            size={20}
            color="#657286"
          />

          <div
            style={{
              flex: 1,
            }}
          >

            <strong
              style={{
                color: "#263249",
                fontSize: "13px",
              }}
            >
              Notifications
            </strong>

            <span
              style={{
                display: "block",
                color: "#8994a6",
                fontSize: "10px",
                marginTop: "4px",
              }}
            >
              Receive system and agent
              notifications.
            </span>

          </div>

          <Toggle
            value={notifications}
            onChange={
              setNotifications
            }
          />

        </div>


        {/* ====================================================
            AUTO REFRESH
        ==================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "20px 0",
            borderBottom:
              "1px solid #f0f2f5",
          }}
        >

          <RefreshCw
            size={20}
            color="#657286"
          />

          <div
            style={{
              flex: 1,
            }}
          >

            <strong
              style={{
                color: "#263249",
                fontSize: "13px",
              }}
            >
              Automatic Refresh
            </strong>

            <span
              style={{
                display: "block",
                color: "#8994a6",
                fontSize: "10px",
                marginTop: "4px",
              }}
            >
              Automatically refresh
              monitoring and analytics
              information.
            </span>

          </div>

          <Toggle
            value={autoRefresh}
            onChange={
              setAutoRefresh
            }
          />

        </div>


        {/* ====================================================
            REFRESH INTERVAL
        ==================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "20px 0",
            borderBottom:
              "1px solid #f0f2f5",
          }}
        >

          <RefreshCw
            size={19}
            color="#657286"
          />

          <div
            style={{
              flex: 1,
            }}
          >

            <strong
              style={{
                color: "#263249",
                fontSize: "13px",
              }}
            >
              Refresh Interval
            </strong>

            <span
              style={{
                display: "block",
                color: "#8994a6",
                fontSize: "10px",
                marginTop: "4px",
              }}
            >
              Choose how frequently live
              dashboard information updates.
            </span>

          </div>

          <select
            value={refreshInterval}
            onChange={(event) =>
              setRefreshInterval(
                Number(event.target.value)
              )
            }
            disabled={!autoRefresh}
            style={{
              height: "36px",
              minWidth: "100px",
              border:
                "1px solid #dfe5ed",
              borderRadius: "8px",
              background: autoRefresh
                ? "#fff"
                : "#f3f4f6",
              color: "#263249",
              padding:
                "0 10px",
              outline: "none",
              cursor: autoRefresh
                ? "pointer"
                : "not-allowed",
              fontSize: "11px",
            }}
          >

            <option value={10}>
              10 seconds
            </option>

            <option value={30}>
              30 seconds
            </option>

            <option value={60}>
              60 seconds
            </option>

            <option value={120}>
              2 minutes
            </option>

          </select>

        </div>


        {/* ====================================================
            SECURITY
        ==================================================== */}

        <div
          style={{
            marginTop: "22px",
            padding: "15px",
            background: "#effaf7",
            border:
              "1px solid #c8efdf",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >

          <ShieldCheck
            color="#159c79"
            size={18}
          />

          <div>

            <strong
              style={{
                display: "block",
                color: "#159c79",
                fontSize: "11px",
              }}
            >
              Secure Environment
            </strong>

            <span
              style={{
                display: "block",
                color: "#4d8b78",
                fontSize: "10px",
                marginTop: "3px",
              }}
            >
              OmniBrain security
              protections are enabled.
            </span>

          </div>

        </div>


        {/* ====================================================
            CURRENT STATUS
        ==================================================== */}

        <div
          style={{
            marginTop: "18px",
            padding: "13px 15px",
            background: "#f8fafc",
            border:
              "1px solid #e7ecf2",
            borderRadius: "9px",
            fontSize: "11px",
            color: "#657286",
          }}
        >

          <strong>
            Current preferences:
          </strong>{" "}

          Notifications{" "}

          <b
            style={{
              color: notifications
                ? "#20a77d"
                : "#8994a6",
            }}
          >
            {notifications
              ? "ON"
              : "OFF"}
          </b>

          {" • "}

          Automatic Refresh{" "}

          <b
            style={{
              color: autoRefresh
                ? "#20a77d"
                : "#8994a6",
            }}
          >
            {autoRefresh
              ? "ON"
              : "OFF"}
          </b>

          {" • "}

          Interval{" "}

          <b
            style={{
              color: autoRefresh
                ? "#2879df"
                : "#8994a6",
            }}
          >
            {autoRefresh
              ? `${refreshInterval}s`
              : "Disabled"}
          </b>

        </div>


        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "22px",
          }}
        >

          <button
            type="button"
            onClick={
              saveSettings
            }
            style={{
              border: 0,
              background: "#1677df",
              color: "#fff",
              padding:
                "11px 17px",
              borderRadius: "8px",
              display: "flex",
              alignItems:
                "center",
              gap: "7px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >

            <Save size={16} />

            {saved
              ? "Saved!"
              : "Save Settings"}

          </button>


          <button
            type="button"
            onClick={
              resetSettings
            }
            style={{
              border:
                "1px solid #dfe5ed",
              background: "#fff",
              color: "#657286",
              padding:
                "11px 16px",
              borderRadius: "8px",
              display: "flex",
              alignItems:
                "center",
              gap: "7px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >

            <RotateCcw
              size={15}
            />

            Reset

          </button>

        </div>

      </div>

    </div>
  );
}

export default SettingsPage;