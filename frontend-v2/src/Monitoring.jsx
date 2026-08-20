import { useEffect, useState } from "react";

import {
  Activity,
  Bot,
  CheckCircle2,
  Database,
  Server,
  ShieldCheck,
  Cpu,
  Clock3,
  BarChart3,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const DEFAULT_REFRESH_SETTINGS = {
  autoRefresh: true,
  refreshInterval: 30,
};

function Monitoring() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [refreshSettings, setRefreshSettings] = useState(
    DEFAULT_REFRESH_SETTINGS
  );

  // ============================================================
  // LOAD AGENTS
  // ============================================================

  const loadAgents = async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      }

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        setError("Authentication required.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/agents/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // --------------------------------------------------------
      // AUTHENTICATION ERROR
      // --------------------------------------------------------

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_email");

        window.location.href = "/";

        return;
      }

      // --------------------------------------------------------
      // API ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          `Unable to load AI agents (${response.status}).`
        );
      }

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      const data = await response.json();

      const agentList = Array.isArray(data)
        ? data
        : [];

      setAgents(agentList);
      setError("");
      setLastUpdated(new Date());

    } catch (err) {
      console.error(
        "Monitoring error:",
        err
      );

      setError(
        "Unable to connect to the monitoring service."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // READ SETTINGS
  // ============================================================

  const getRefreshSettings = () => {
    try {
      const stored =
        localStorage.getItem(
          "omnibrain_settings"
        );

      if (!stored) {
        return DEFAULT_REFRESH_SETTINGS;
      }

      const settings =
        JSON.parse(stored);

      const interval =
        Number(
          settings.refreshInterval
        );

      return {
        autoRefresh:
          settings.autoRefresh ??
          DEFAULT_REFRESH_SETTINGS.autoRefresh,

        refreshInterval:
          Number.isFinite(interval) &&
          interval > 0
            ? interval
            : DEFAULT_REFRESH_SETTINGS.refreshInterval,
      };

    } catch (error) {
      console.error(
        "Unable to read refresh settings:",
        error
      );

      return DEFAULT_REFRESH_SETTINGS;
    }
  };

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    // Initial agent load
    loadAgents();

    let interval = null;

    // ----------------------------------------------------------
    // START / RESTART REFRESH TIMER
    // ----------------------------------------------------------

    const startRefresh = () => {
      // Clear previous timer
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      const settings =
        getRefreshSettings();

      setRefreshSettings(settings);

      console.log(
        "Monitoring refresh settings:",
        settings
      );

      // --------------------------------------------------------
      // AUTO REFRESH OFF
      // --------------------------------------------------------

      if (!settings.autoRefresh) {
        console.log(
          "Monitoring auto-refresh is OFF"
        );

        return;
      }

      // --------------------------------------------------------
      // AUTO REFRESH ON
      // --------------------------------------------------------

      interval = setInterval(() => {
        console.log(
          "Monitoring auto-refresh triggered"
        );

        loadAgents(false);

      }, settings.refreshInterval * 1000);
    };

    // Start timer using current settings
    startRefresh();

    // ----------------------------------------------------------
    // SETTINGS CHANGE EVENT
    // ----------------------------------------------------------

    const handleSettingsChange = (event) => {
      console.log(
        "Monitoring settings changed"
      );

      const newSettings =
        event?.detail ||
        getRefreshSettings();

      const intervalValue =
        Number(
          newSettings.refreshInterval
        );

      const normalizedSettings = {
        autoRefresh:
          newSettings.autoRefresh ??
          true,

        refreshInterval:
          Number.isFinite(
            intervalValue
          ) && intervalValue > 0
            ? intervalValue
            : 30,
      };

      setRefreshSettings(
        normalizedSettings
      );

      // Restart timer immediately
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      if (
        !normalizedSettings.autoRefresh
      ) {
        console.log(
          "Monitoring auto-refresh is OFF"
        );

        return;
      }

      console.log(
        "Starting monitoring refresh every",
        normalizedSettings.refreshInterval,
        "seconds"
      );

      interval = setInterval(() => {
        console.log(
          "Monitoring auto-refresh triggered"
        );

        loadAgents(false);

      }, normalizedSettings.refreshInterval * 1000);
    };

    window.addEventListener(
      "omnibrain-settings-changed",
      handleSettingsChange
    );

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {
      if (interval) {
        clearInterval(interval);
      }

      window.removeEventListener(
        "omnibrain-settings-changed",
        handleSettingsChange
      );
    };

    // IMPORTANT:
    // Do not add loadAgents to this dependency array.
  }, []);

  // ============================================================
  // STATISTICS
  // ============================================================

  const running = agents.filter((agent) => {
    const status = String(
      agent.status || ""
    ).toLowerCase();

    return (
      status === "running" ||
      status === "active"
    );
  }).length;

  const idle = agents.filter((agent) => {
    const status = String(
      agent.status || ""
    ).toLowerCase();

    return status === "idle";
  }).length;

  const errorAgents = agents.filter((agent) => {
    const status = String(
      agent.status || ""
    ).toLowerCase();

    return (
      status === "error" ||
      status === "failed" ||
      status === "offline"
    );
  }).length;

  // ============================================================
  // HEALTH
  // ============================================================

  const getHealth = (agent) => {
    const value = Number(
      agent.health ??
        agent.health_score ??
        100
    );

    if (Number.isNaN(value)) {
      return 100;
    }

    return Math.min(
      Math.max(value, 0),
      100
    );
  };

  const averageHealth =
    agents.length > 0
      ? Math.round(
          agents.reduce(
            (sum, agent) =>
              sum + getHealth(agent),
            0
          ) / agents.length
        )
      : 0;

  // ============================================================
  // TOTAL TASKS
  // ============================================================

  const totalTasks = agents.reduce(
    (sum, agent) =>
      sum +
      Number(
        agent.tasks ??
          agent.total_tasks ??
          0
      ),
    0
  );

  // ============================================================
  // CARD STYLE
  // ============================================================

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e7ecf2",
    borderRadius: "14px",
    padding: "20px",
    boxShadow:
      "0 4px 15px rgba(31,52,77,.035)",
  };

  // ============================================================
  // STATUS COLOR
  // ============================================================

  const getStatusColor = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (
      value === "running" ||
      value === "active"
    ) {
      return "#20a77d";
    }

    if (value === "idle") {
      return "#ed8b3d";
    }

    if (
      value === "error" ||
      value === "failed" ||
      value === "offline"
    ) {
      return "#ef5350";
    }

    return "#8994a6";
  };

  // ============================================================
  // HEALTH COLOR
  // ============================================================

  const getHealthColor = (health) => {
    if (health >= 90) {
      return "#20a77d";
    }

    if (health >= 70) {
      return "#ed8b3d";
    }

    return "#ef5350";
  };

  // ============================================================
  // FORMAT LAST ACTIVITY
  // ============================================================

  const formatActivity = (value) => {
    if (!value) {
      return "No activity recorded";
    }

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleString();

    } catch {
      return String(value);
    }
  };

  // ============================================================
  // MAIN
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
              Workspace
            </span>

            <b>
              /
            </b>

            <strong>
              Monitoring
            </strong>

          </div>

          <h1>
            System Monitoring
          </h1>

          <p>
            Monitor your AI agents and
            operational status in real time.
          </p>

        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >

          {lastUpdated && (
            <span
              style={{
                color: "#8994a6",
                fontSize: "10px",
              }}
            >
              Updated{" "}
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              loadAgents(true)
            }
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#2879df",
              borderRadius: "8px",
              padding: "8px 11px",
              cursor: refreshing
                ? "default"
                : "pointer",
              fontSize: "11px",
            }}
          >

            <RefreshCw
              size={14}
              style={{
                animation: refreshing
                  ? "spin 1s linear infinite"
                  : "none",
              }}
            />

            Refresh

          </button>

        </div>

      </div>

      {/* ======================================================
          STATISTICS
          ====================================================== */}

      <div className="monitoring-stat-grid">

        {[
          [
            "Total Agents",
            agents.length,
            Bot,
            "#2879df",
          ],

          [
            "Running",
            running,
            CheckCircle2,
            "#20a77d",
          ],

          [
            "Idle",
            idle,
            Activity,
            "#ed8b3d",
          ],

          [
            "System Health",
            `${averageHealth}%`,
            ShieldCheck,
            "#8250d6",
          ],

        ].map(
          ([
            title,
            value,
            Icon,
            iconColor,
          ]) => (

            <div
              style={cardStyle}
              key={title}
            >

              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "11px",
                  background: "#edf6ff",
                  color: iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >

                <Icon size={21} />

              </div>

              <p
                style={{
                  color: "#7b879a",
                  fontSize: "12px",
                  margin: "15px 0 5px",
                }}
              >
                {title}
              </p>

              <h2
                style={{
                  margin: 0,
                  color: "#17243c",
                  fontSize: "28px",
                }}
              >
                {loading
                  ? "..."
                  : value}
              </h2>

            </div>

          )
        )}

      </div>

      {/* ======================================================
          SECONDARY SUMMARY
          ====================================================== */}

      {!loading &&
        agents.length > 0 && (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "18px",
              marginBottom: "20px",
            }}
          >

            <div style={cardStyle}>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >

                <BarChart3
                  size={19}
                  color="#2879df"
                />

                <div>

                  <strong
                    style={{
                      fontSize: "12px",
                      color: "#263249",
                    }}
                  >
                    Total Tasks Processed
                  </strong>

                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      marginTop: "5px",
                      color: "#17243c",
                    }}
                  >
                    {totalTasks.toLocaleString()}
                  </div>

                </div>

              </div>

            </div>

            <div style={cardStyle}>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >

                <AlertTriangle
                  size={19}
                  color={
                    errorAgents > 0
                      ? "#ef5350"
                      : "#20a77d"
                  }
                />

                <div>

                  <strong
                    style={{
                      fontSize: "12px",
                      color: "#263249",
                    }}
                  >
                    Agent Errors
                  </strong>

                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      marginTop: "5px",
                      color:
                        errorAgents > 0
                          ? "#ef5350"
                          : "#20a77d",
                    }}
                  >
                    {errorAgents}
                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

      {/* ======================================================
          LIVE AGENT MONITORING
          ====================================================== */}

      <div style={cardStyle}>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >

            <h2
              style={{
                margin: 0,
                fontSize: "16px",
              }}
            >
              Live Agent Monitoring
            </h2>

            <span
              style={{
                background: "#e9f9f2",
                color: "#1b9c78",
                borderRadius: "7px",
                padding: "5px 8px",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              â— Live
            </span>

          </div>

          <span
            style={{
              color: refreshSettings.autoRefresh
                ? "#20a77d"
                : "#8994a6",
              fontSize: "10px",
              fontWeight: 600,
            }}
          >
            {refreshSettings.autoRefresh
              ? `Auto-refresh: ${refreshSettings.refreshInterval} seconds`
              : "Auto-refresh: Off"}
          </span>

        </div>

        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (

          <div
            style={{
              padding: "14px",
              background: "#fff5f5",
              border: "1px solid #f5d5d5",
              borderRadius: "9px",
              color: "#d9534f",
              fontSize: "11px",
              marginBottom: "10px",
            }}
          >
            {error}
          </div>

        )}

        {/* ====================================================
            LOADING
            ==================================================== */}

        {loading && (

          <div
            style={{
              padding: "35px 10px",
              textAlign: "center",
              color: "#8994a6",
              fontSize: "12px",
            }}
          >
            Loading AI agents...
          </div>

        )}

        {/* ====================================================
            NO AGENTS
            ==================================================== */}

        {!loading &&
          !error &&
          agents.length === 0 && (

            <div
              style={{
                padding: "35px 10px",
                textAlign: "center",
                color: "#8994a6",
                fontSize: "12px",
              }}
            >

              <Bot
                size={30}
                style={{
                  marginBottom: "10px",
                  opacity: 0.45,
                }}
              />

              <div>
                No agents available
                for monitoring.
              </div>

              <small
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                Create an AI agent from
                the AI Agents section.
              </small>

            </div>

          )}

        {/* ====================================================
            AGENT LIST
            ==================================================== */}

        {!loading &&
          agents.length > 0 && (

            <div>

              {agents.map((agent) => {

                const status =
                  agent.status || "Idle";

                const health =
                  getHealth(agent);

                const tasks =
                  Number(
                    agent.tasks ??
                      agent.total_tasks ??
                      0
                  );

                return (

                  <div
                    key={
                      agent.id ||
                      agent.name
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      padding: "15px 0",
                      borderBottom:
                        "1px solid #f0f2f5",
                    }}
                  >

                    {/* ICON */}

                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: "#edf6ff",
                        color: "#2879df",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >

                      <Cpu size={20} />

                    </div>

                    {/* DETAILS */}

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >

                      <strong
                        style={{
                          display: "block",
                          color: "#1d2940",
                          fontSize: "12px",
                        }}
                      >
                        {agent.name ||
                          "Unnamed Agent"}
                      </strong>

                      <div
                        style={{
                          color: "#8a95a7",
                          fontSize: "10px",
                          marginTop: "4px",
                        }}
                      >
                        {agent.category ||
                          "AI Agent"}
                      </div>

                    </div>

                    {/* LAST ACTIVITY */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#8994a6",
                        fontSize: "9px",
                        minWidth: "145px",
                      }}
                    >

                      <Clock3 size={12} />

                      {formatActivity(
                        agent.last_activity ||
                          agent.lastActivity
                      )}

                    </div>

                    {/* TASKS */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#68758a",
                        fontSize: "10px",
                        minWidth: "45px",
                      }}
                    >

                      <BarChart3 size={13} />

                      {tasks}

                    </div>

                    {/* STATUS */}

                    <strong
                      style={{
                        color:
                          getStatusColor(
                            status
                          ),
                        fontSize: "11px",
                        minWidth: "60px",
                        textAlign: "right",
                      }}
                    >
                      {status}
                    </strong>

                    {/* HEALTH */}

                    <span
                      style={{
                        color:
                          getHealthColor(
                            health
                          ),
                        fontWeight: 700,
                        fontSize: "11px",
                        minWidth: "42px",
                        textAlign: "right",
                      }}
                    >
                      {health}%
                    </span>

                  </div>

                );
              })}

            </div>

          )}

      </div>

      {/* ======================================================
          INFRASTRUCTURE
          ====================================================== */}

      <div
        className="monitoring-infrastructure"
      >

        {[
          [
            "Backend API",
            "FastAPI",
            Server,
          ],

          [
            "Database",
            "PostgreSQL",
            Database,
          ],

          [
            "Security",
            "Authentication",
            ShieldCheck,
          ],

        ].map(
          ([
            name,
            value,
            Icon,
          ]) => (

            <div
              style={cardStyle}
              key={name}
            >

              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#e8f8f1",
                  color: "#20a77d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >

                <Icon size={20} />

              </div>

              <strong
                style={{
                  display: "block",
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "#263249",
                }}
              >
                {name}
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: "5px",
                  color: "#20a77d",
                  fontSize: "10px",
                }}
              >
                â— {value}
              </span>

            </div>

          )
        )}

      </div>

      {/* ======================================================
          RESPONSIVE + ANIMATION
          ====================================================== */}

      <style>
        {`
          .monitoring-stat-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 20px;
          }

          .monitoring-infrastructure {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 18px;
            margin-top: 20px;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1000px) {
            .monitoring-stat-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .monitoring-infrastructure {
              grid-template-columns:
                1fr;
            }
          }

          @media (max-width: 700px) {
            .monitoring-stat-grid {
              grid-template-columns: 1fr;
            }

            .monitoring-infrastructure {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .monitoring-stat-grid + div {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

    </div>
  );
}

export default Monitoring;

