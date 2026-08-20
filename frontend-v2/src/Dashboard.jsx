import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AIAgents from "./AIAgents";
import Monitoring from "./Monitoring";
import Analytics from "./Analytics";
import Knowledge from "./Knowledge";
import Alerts from "./Alerts";
import SettingsPage from "./SettingsPage";
import SearchPanel from "./SearchPanel";
import NotificationPanel from "./NotificationsPanel";
import ProfilePanel from "./ProfilePanel";

import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  ChevronRight,
  Database,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

const DEFAULT_REFRESH_SETTINGS = {
  autoRefresh: true,
  refreshInterval: 30,
};

function Dashboard() {
  // ============================================================
  // USER
  // ============================================================

  const storedEmail =
    localStorage.getItem("user_email") || "";

  // ============================================================
  // NAVIGATION / UI STATE
  // ============================================================

  const [activeMenu, setActiveMenu] =
    useState("Overview");

  const [showSearch, setShowSearch] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showProfile, setShowProfile] =
    useState(false);

  // ============================================================
  // SETTINGS STATE
  // ============================================================

  const [autoRefreshEnabled, setAutoRefreshEnabled] =
    useState(
      DEFAULT_REFRESH_SETTINGS.autoRefresh
    );

  const [refreshInterval, setRefreshInterval] =
    useState(
      DEFAULT_REFRESH_SETTINGS.refreshInterval
    );

  // ============================================================
  // DASHBOARD STATE
  // ============================================================

  const [dashboardData, setDashboardData] =
    useState(null);

  const [agents, setAgents] =
    useState([]);

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState("");

  // ============================================================
  // AI CHAT STATE
  // ============================================================

  const [chatMessage, setChatMessage] =
    useState("");

  const [chatReply, setChatReply] =
    useState("");

  const [chatSources, setChatSources] =
    useState([]);

  const [chatAgent, setChatAgent] =
    useState("");

  const [chatLoading, setChatLoading] =
    useState(false);

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  const loadDashboard = useCallback(
    async (showLoader = true) => {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        setDashboardLoading(false);
        setDashboardError(
          "Authentication required."
        );
        return;
      }

      try {
        if (showLoader) {
          setDashboardLoading(true);
        }

        setDashboardError("");

        // ------------------------------------------------------
        // DASHBOARD API
        // ------------------------------------------------------

        const dashboardResponse =
          await fetch(
            `${API_URL}/dashboard/`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const dashboardJson =
          await dashboardResponse
            .json()
            .catch(() => ({}));

        // ------------------------------------------------------
        // AUTH ERROR
        // ------------------------------------------------------

        if (
          dashboardResponse.status === 401
        ) {
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "user_email"
          );

          window.location.href = "/";

          return;
        }

        // ------------------------------------------------------
        // API ERROR
        // ------------------------------------------------------

        if (!dashboardResponse.ok) {
          throw new Error(
            dashboardJson?.detail ||
              "Unable to load dashboard."
          );
        }

        setDashboardData(
          dashboardJson
        );

        // ------------------------------------------------------
        // AGENTS API
        // ------------------------------------------------------

        const agentsResponse =
          await fetch(
            `${API_URL}/agents/`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        // ------------------------------------------------------
        // AGENT AUTH ERROR
        // ------------------------------------------------------

        if (
          agentsResponse.status === 401
        ) {
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "user_email"
          );

          window.location.href = "/";

          return;
        }

        // ------------------------------------------------------
        // AGENTS SUCCESS
        // ------------------------------------------------------

        if (agentsResponse.ok) {
          const agentsJson =
            await agentsResponse.json();

          setAgents(
            Array.isArray(agentsJson)
              ? agentsJson
              : []
          );
        } else {
          console.warn(
            "Unable to load agents:",
            agentsResponse.status
          );

          setAgents([]);
        }
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );

        setDashboardError(
          error?.message ||
            "Unable to connect to the backend."
        );
      } finally {
        setDashboardLoading(false);
      }
    },
    []
  );

  // ============================================================
  // LOAD SAVED SETTINGS
  // ============================================================

  useEffect(() => {
    const loadRefreshSettings = () => {
      try {
        const stored =
          localStorage.getItem(
            "omnibrain_settings"
          );

        // ------------------------------------------------------
        // NO SAVED SETTINGS
        // ------------------------------------------------------

        if (!stored) {
          setAutoRefreshEnabled(
            DEFAULT_REFRESH_SETTINGS.autoRefresh
          );

          setRefreshInterval(
            DEFAULT_REFRESH_SETTINGS.refreshInterval
          );

          return;
        }

        const settings =
          JSON.parse(stored);

        // ------------------------------------------------------
        // STRICT BOOLEAN CHECK
        // ------------------------------------------------------

        const savedAutoRefresh =
          settings?.autoRefresh === true;

        // ------------------------------------------------------
        // INTERVAL
        // ------------------------------------------------------

        const savedInterval =
          Number(
            settings?.refreshInterval
          );

        const validInterval =
          Number.isFinite(
            savedInterval
          ) &&
          savedInterval >= 5;

        // ------------------------------------------------------
        // APPLY SETTINGS
        // ------------------------------------------------------

        setAutoRefreshEnabled(
          savedAutoRefresh
        );

        setRefreshInterval(
          validInterval
            ? savedInterval
            : DEFAULT_REFRESH_SETTINGS.refreshInterval
        );
      } catch (error) {
        console.error(
          "Unable to load OmniBrain refresh settings:",
          error
        );

        setAutoRefreshEnabled(
          DEFAULT_REFRESH_SETTINGS.autoRefresh
        );

        setRefreshInterval(
          DEFAULT_REFRESH_SETTINGS.refreshInterval
        );
      }
    };

    loadRefreshSettings();

    // ==========================================================
    // LISTEN FOR SETTINGS CHANGES
    // ==========================================================

    const handleSettingsChange = (
      event
    ) => {
      const settings =
        event?.detail || {};

      // --------------------------------------------------------
      // STRICT BOOLEAN
      // --------------------------------------------------------

      const newAutoRefresh =
        settings.autoRefresh === true;

      // --------------------------------------------------------
      // INTERVAL
      // --------------------------------------------------------

      const newInterval =
        Number(
          settings.refreshInterval
        );

      const validInterval =
        Number.isFinite(
          newInterval
        ) &&
        newInterval >= 5;

      // --------------------------------------------------------
      // UPDATE STATE
      // --------------------------------------------------------

      setAutoRefreshEnabled(
        newAutoRefresh
      );

      setRefreshInterval(
        validInterval
          ? newInterval
          : DEFAULT_REFRESH_SETTINGS.refreshInterval
      );
    };

    window.addEventListener(
      "omnibrain-settings-changed",
      handleSettingsChange
    );

    return () => {
      window.removeEventListener(
        "omnibrain-settings-changed",
        handleSettingsChange
      );
    };
  }, []);

  // ============================================================
  // INITIAL DASHBOARD LOAD
  // ============================================================

  useEffect(() => {
    loadDashboard(true);
  }, [loadDashboard]);

  // ============================================================
  // AUTO REFRESH
  // ============================================================

  useEffect(() => {
    // ----------------------------------------------------------
    // IMPORTANT:
    // If automatic refresh is OFF, there must be NO timer.
    // React will also run the previous effect cleanup here.
    // ----------------------------------------------------------

    if (autoRefreshEnabled !== true) {
      return undefined;
    }

    // ----------------------------------------------------------
    // VALIDATE INTERVAL
    // ----------------------------------------------------------

    if (
      !Number.isFinite(
        refreshInterval
      ) ||
      refreshInterval < 5
    ) {
      return undefined;
    }

    // ----------------------------------------------------------
    // CREATE REFRESH TIMER
    // ----------------------------------------------------------

    const intervalId =
      window.setInterval(() => {
        loadDashboard(false);
      }, refreshInterval * 1000);

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [
    autoRefreshEnabled,
    refreshInterval,
    loadDashboard,
  ]);

  // ============================================================
  // NORMALIZE AGENT STATUS
  // ============================================================

  const getAgentStatus = (agent) => {
    return String(
      agent?.status || "Idle"
    )
      .trim()
      .toLowerCase();
  };

  // ============================================================
  // DASHBOARD STATISTICS
  // ============================================================

  const statistics =
    dashboardData?.statistics || {};

  // ============================================================
  // TOTAL AGENTS
  // ============================================================

  const totalAgents =
    Number(
      statistics.total_agents ??
        agents.length ??
        0
    );

  // ============================================================
  // ACTIVE AGENTS
  // ============================================================

  const calculatedActiveAgents =
    agents.filter((agent) => {
      const status =
        getAgentStatus(agent);

      return (
        status === "running" ||
        status === "active"
      );
    }).length;

  const activeAgents =
    Number(
      statistics.active_agents ??
        calculatedActiveAgents
    );

  // ============================================================
  // IDLE AGENTS
  // ============================================================

  const calculatedIdleAgents =
    agents.filter((agent) => {
      return (
        getAgentStatus(agent) ===
        "idle"
      );
    }).length;

  const idleAgents =
    Number(
      statistics.idle_agents ??
        calculatedIdleAgents
    );

  // ============================================================
  // ERROR AGENTS
  // ============================================================

  const calculatedErrorAgents =
    agents.filter((agent) => {
      const status =
        getAgentStatus(agent);

      return (
        status === "error" ||
        status === "failed" ||
        status === "offline"
      );
    }).length;

  const errorAgents =
    Number(
      statistics.error_agents ??
        calculatedErrorAgents
    );

  // ============================================================
  // TOTAL TASKS
  // ============================================================

  const calculatedTotalTasks =
    agents.reduce(
      (sum, agent) => {
        const tasks =
          Number(
            agent?.tasks ??
              agent?.total_tasks ??
              0
          );

        return (
          sum +
          (Number.isFinite(tasks)
            ? tasks
            : 0)
        );
      },
      0
    );

  const totalTasks =
    Number(
      statistics.total_tasks ??
        calculatedTotalTasks
    );

  // ============================================================
  // AVERAGE HEALTH
  // ============================================================

  const calculatedAverageHealth =
    agents.length > 0
      ? agents.reduce(
          (sum, agent) => {
            const health =
              Number(
                agent?.health ??
                  agent?.health_score ??
                  100
              );

            return (
              sum +
              (Number.isFinite(
                health
              )
                ? health
                : 100)
            );
          },
          0
        ) / agents.length
      : 0;

  const averageHealth =
    Number(
      statistics.average_health ??
        calculatedAverageHealth
    );

  // Keep health between 0 and 100.
  const safeHealth =
    Number.isFinite(
      averageHealth
    )
      ? Math.min(
          Math.max(
            Math.round(
              averageHealth
            ),
            0
          ),
          100
        )
      : 0;

  // ============================================================
  // USERNAME
  // ============================================================

  const username =
    dashboardData?.user?.username ||
    storedEmail.split("@")[0] ||
    "Satwik";

  // ============================================================
  // SYSTEM STATUS
  // ============================================================

  const systemHealthy =
    errorAgents === 0 &&
    safeHealth >= 80;

  const systemStatus =
    systemHealthy
      ? "Healthy"
      : safeHealth >= 50
      ? "Warning"
      : "Critical";

  // ============================================================
  // ALERT COUNT
  // ============================================================

  const alertCount =
    Math.max(
      0,
      Number(
        dashboardData?.alerts_count ??
          statistics?.alerts_count ??
          errorAgents ??
          0
      )
    );

  // ============================================================
  // SERVICE STATUS
  // ============================================================

  const serviceStatus =
    dashboardData?.services || {};

  const getServiceStatus = (
    key,
    fallback = "Unknown"
  ) => {
    const value =
      serviceStatus?.[key];

    if (
      typeof value === "string"
    ) {
      return value;
    }

    if (
      typeof value === "boolean"
    ) {
      return value
        ? "Online"
        : "Offline";
    }

    return fallback;
  };

  // ============================================================
  // SERVICES
  // ============================================================

  const services = [
    {
      name: "Backend API",
      description:
        "FastAPI service",
      status:
        getServiceStatus(
          "backend_api",
          "Online"
        ),
    },

    {
      name: "Database",
      description:
        "PostgreSQL",
      status:
        getServiceStatus(
          "database",
          "Connected"
        ),
    },

    {
      name: "AI Models",
      description:
        "Ollama / Llama 3.2",
      status:
        getServiceStatus(
          "ai_models",
          "Available"
        ),
    },

    {
      name: "Vector Database",
      description:
        "ChromaDB",
      status:
        getServiceStatus(
          "vector_database",
          "Indexed"
        ),
    },
  ];

  // ============================================================
  // AGENT ICON
  // ============================================================

  const getAgentIcon = (agent) => {
    const category =
      String(
        agent?.category || ""
      ).toLowerCase();

    if (
      category.includes(
        "analytics"
      )
    ) {
      return (
        <BarChart3 size={18} />
      );
    }

    if (
      category.includes(
        "monitor"
      )
    ) {
      return (
        <Activity size={18} />
      );
    }

    if (
      category.includes(
        "knowledge"
      )
    ) {
      return (
        <Database size={18} />
      );
    }

    if (
      category.includes(
        "security"
      )
    ) {
      return (
        <ShieldCheck size={18} />
      );
    }

    return <Bot size={18} />;
  };

  // ============================================================
  // FORMAT AI RESPONSE
  // ============================================================

  const formatAIResponse = (
    text
  ) => {
    if (!text) {
      return null;
    }

    const lines =
      String(text).split(
        /\r?\n/
      );

    return lines.map(
      (line, index) => {
        const trimmed =
          line.trim();

        if (!trimmed) {
          return (
            <div
              key={index}
              style={{
                height: "8px",
              }}
            />
          );
        }

        const parts =
          trimmed.split(
            /(\*\*.*?\*\*)/g
          );

        return (
          <div
            key={index}
            style={{
              marginBottom:
                "7px",
              lineHeight:
                "1.65",
            }}
          >
            {parts.map(
              (
                part,
                partIndex
              ) => {
                if (
                  part.startsWith(
                    "**"
                  ) &&
                  part.endsWith(
                    "**"
                  )
                ) {
                  return (
                    <strong
                      key={
                        partIndex
                      }
                    >
                      {part.slice(
                        2,
                        -2
                      )}
                    </strong>
                  );
                }

                return (
                  <span
                    key={
                      partIndex
                    }
                  >
                    {part}
                  </span>
                );
              }
            )}
          </div>
        );
      }
    );
  };

  // ============================================================
  // ANALYTICS BAR DATA
  // ============================================================

  const chartData =
    useMemo(() => {
      if (!agents.length) {
        return [];
      }

      const taskValues =
        agents.map(
          (agent) => {
            const value =
              Number(
                agent?.tasks ??
                  agent?.total_tasks ??
                  0
              );

            return Number.isFinite(
              value
            )
              ? value
              : 0;
          }
        );

      const maxTasks =
        Math.max(
          ...taskValues,
          1
        );

      return agents
        .slice(0, 7)
        .map(
          (agent) => {
            const value =
              Number(
                agent?.tasks ??
                  agent?.total_tasks ??
                  0
              );

            const safeValue =
              Number.isFinite(
                value
              )
                ? value
                : 0;

            const agentName =
              agent?.name ||
              "Agent";

            return {
              label:
                agentName.length >
                12
                  ? `${agentName.slice(
                      0,
                      12
                    )}â€¦`
                  : agentName,

              value:
                safeValue,

              height:
                `${Math.max(
                  8,
                  Math.round(
                    (safeValue /
                      maxTasks) *
                      100
                  )
                )}%`,
            };
          }
        );
    }, [agents]);

  // ============================================================
  // SEND AI MESSAGE
  // ============================================================

  const sendMessage =
    async () => {
      const message =
        chatMessage.trim();

      if (
        !message ||
        chatLoading
      ) {
        return;
      }

      setChatLoading(true);
      setChatReply("");
      setChatSources([]);
      setChatAgent("");

      try {
        const token =
          localStorage.getItem(
            "access_token"
          );

        const response =
          await fetch(
            `${API_URL}/chat/`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                ...(token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {}),
              },

              body: JSON.stringify({
                message,
              }),
            }
          );

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        // ------------------------------------------------------
        // AUTH ERROR
        // ------------------------------------------------------

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "user_email"
          );

          window.location.href = "/";

          return;
        }

        // ------------------------------------------------------
        // BACKEND ERROR
        // ------------------------------------------------------

        if (!response.ok) {
          setChatReply(
            data?.detail ||
              "OmniBrain AI could not process your request."
          );

          setChatAgent(
            data?.agent ||
              "General AI Agent"
          );

          return;
        }

        // ------------------------------------------------------
        // AI RESPONSE
        // ------------------------------------------------------

        const reply =
          typeof data?.reply ===
          "string"
            ? data.reply.trim()
            : "";

        const sources =
          Array.isArray(
            data?.sources
          )
            ? data.sources
            : [];

        const agent =
          typeof data?.agent ===
            "string" &&
          data.agent.trim()
            ? data.agent.trim()
            : "General AI Agent";

        // ------------------------------------------------------
        // EMPTY RESPONSE
        // ------------------------------------------------------

        if (!reply) {
          setChatReply(
            "OmniBrain AI did not return an answer. Please try again."
          );

          setChatAgent(agent);

          return;
        }

        // ------------------------------------------------------
        // DISPLAY RESPONSE
        // ------------------------------------------------------

        setChatReply(reply);
        setChatSources(sources);
        setChatAgent(agent);
        setChatMessage("");

        // ------------------------------------------------------
        // REFRESH DASHBOARD AFTER CHAT
        // ------------------------------------------------------

        // This is a MANUAL refresh caused by the user
        // asking the AI something. It does NOT start
        // automatic refresh.
        loadDashboard(false);
      } catch (error) {
        console.error(
          "OmniBrain Chat Error:",
          error
        );

        setChatReply(
          "Cannot connect to OmniBrain AI. Please make sure the FastAPI backend and Ollama are running."
        );

        setChatAgent(
          "General AI Agent"
        );
      } finally {
        setChatLoading(false);
      }
    };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user_email"
    );

    window.location.href = "/";
  };

  // ============================================================
  // REFRESH DISPLAY TEXT
  // ============================================================

  const refreshDisplayText =
    autoRefreshEnabled
      ? refreshInterval >= 60
        ? `${refreshInterval / 60} minute${
            refreshInterval / 60 !==
            1
              ? "s"
              : ""
          }`
        : `${refreshInterval} seconds`
      : "Disabled";

  // ============================================================
  // NAVIGATION
  // ============================================================

  const menuItems = [
    {
      name: "Overview",
      icon: (
        <LayoutDashboard
          size={18}
        />
      ),
    },

    {
      name: "AI Agents",
      icon: <Bot size={18} />,
    },

    {
      name: "Monitoring",
      icon: (
        <Activity size={18} />
      ),
    },

    {
      name: "Analytics",
      icon: (
        <BarChart3 size={18} />
      ),
    },

    {
      name: "Knowledge",
      icon: (
        <Database size={18} />
      ),
    },
  ];

  const systemItems = [
    {
      name: "Alerts",
      icon: <Bell size={18} />,
      count:
        alertCount > 0
          ? alertCount
          : null,
    },

    {
      name: "Settings",
      icon: (
        <Settings size={18} />
      ),
    },
  ];

  // ============================================================
  // MAIN RETURN
  // ============================================================

  return (
    <div className="ob-dashboard">

      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside className="ob-sidebar">

        {/* LOGO */}

        <div className="ob-logo">

          <div className="ob-logo-icon">

            <BrainCircuit
              size={23}
            />

          </div>

          <div className="ob-logo-text">

            <h2>
              OmniBrain
            </h2>

            <span>
              Intelligence Platform
            </span>

          </div>

        </div>

        {/* WORKSPACE */}

        <div className="ob-section-title">
          WORKSPACE
        </div>

        <nav className="ob-nav">

          {menuItems.map(
            (item) => (
              <button
                key={item.name}
                className={`ob-nav-item ${
                  activeMenu ===
                  item.name
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveMenu(
                    item.name
                  )
                }
              >

                {item.icon}

                <span>
                  {item.name}
                </span>

              </button>
            )
          )}

        </nav>

        {/* SYSTEM */}

        <div className="ob-section-title system-title">
          SYSTEM
        </div>

        <nav className="ob-nav">

          {systemItems.map(
            (item) => (
              <button
                key={item.name}
                className={`ob-nav-item ${
                  activeMenu ===
                  item.name
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveMenu(
                    item.name
                  )
                }
              >

                {item.icon}

                <span>
                  {item.name}
                </span>

                {item.count && (
                  <span className="alert-count">
                    {item.count}
                  </span>
                )}

              </button>
            )
          )}

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="ob-sidebar-bottom">

          <div className="ob-security">

            <ShieldCheck
              size={19}
            />

            <div>

              <strong>
                Secure Environment
              </strong>

              <span>
                All systems protected
              </span>

              <small>
                ðŸ”’ Enterprise Security
              </small>

            </div>

          </div>

          <button
            className="ob-logout"
            onClick={logout}
          >

            <LogOut
              size={18}
            />

            <span>
              Sign out
            </span>

          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="ob-main">

        {/* ====================================================
            AI AGENTS
            ==================================================== */}

        {activeMenu ===
        "AI Agents" ? (

          <AIAgents />

        ) : activeMenu ===
          "Monitoring" ? (

          <Monitoring />

        ) : activeMenu ===
          "Analytics" ? (

          <Analytics />

        ) : activeMenu ===
          "Knowledge" ? (

          <Knowledge />

        ) : activeMenu ===
          "Alerts" ? (

          <Alerts />

        ) : activeMenu ===
          "Settings" ? (

          <SettingsPage />

        ) : (

          <>

            {/* =================================================
                HEADER
                ================================================= */}

            <header className="ob-header">

              <div className="ob-header-left">

                <div className="ob-breadcrumb">

                  <span>
                    Workspace
                  </span>

                  <b>
                    /
                  </b>

                  <strong>
                    Overview
                  </strong>

                </div>

                <h1>
                  Intelligence Command Center
                </h1>

                <p>
                  Monitor your AI systems,
                  agents and operational
                  intelligence.
                </p>

              </div>

              <div className="ob-header-right">

                {/* SEARCH */}

                <button
                  className="header-icon"
                  onClick={() =>
                    setShowSearch(true)
                  }
                  title="Search"
                >

                  <Search
                    size={19}
                  />

                </button>

                {/* NOTIFICATIONS */}

                <button
                  className="header-icon notification-icon"
                  onClick={() =>
                    setShowNotifications(
                      true
                    )
                  }
                  title="Notifications"
                >

                  <Bell
                    size={20}
                  />

                  {alertCount >
                    0 && (
                    <span className="notification-dot"></span>
                  )}

                </button>

                {/* PROFILE */}

                <button
                  className="ob-avatar"
                  onClick={() =>
                    setShowProfile(true)
                  }
                  title="Profile"
                  style={{
                    border:
                      "none",
                    cursor:
                      "pointer",
                    padding: 0,
                  }}
                >

                  {username
                    .charAt(0)
                    .toUpperCase()}

                </button>

              </div>

            </header>

            {/* =================================================
                ERROR
                ================================================= */}

            {dashboardError && (

              <div
                style={{
                  marginBottom:
                    "16px",
                  padding:
                    "12px 16px",
                  borderRadius:
                    "10px",
                  background:
                    "#fff7ed",
                  border:
                    "1px solid #fed7aa",
                  color:
                    "#9a3412",
                  fontSize:
                    "13px",
                }}
              >

                {dashboardError}

              </div>

            )}

            {/* =================================================
                WELCOME
                ================================================= */}

            <section className="ob-welcome">

              <div className="welcome-content">

                <div className="welcome-icon">

                  <Sparkles
                    size={22}
                  />

                </div>

                <div>

                  <span className="welcome-label">
                    OMNIBRAIN INTELLIGENCE
                  </span>

                  <h2>
                    Welcome back,{" "}
                    {username}.
                  </h2>

                  <p>
                    Your intelligent
                    workspace is ready.
                    System status is{" "}
                    {systemStatus.toLowerCase()}.
                  </p>

                </div>

              </div>

              <div className="welcome-status">

                <span></span>

                {systemStatus ===
                "Healthy"
                  ? "AI SYSTEM ONLINE"
                  : "SYSTEM REQUIRES ATTENTION"}

              </div>

            </section>

            {/* =================================================
                STATISTICS
                ================================================= */}

            <section className="ob-stats">

              {/* ACTIVE AGENTS */}

              <div className="ob-stat-card">

                <div className="stat-top">

                  <div className="stat-icon blue">

                    <Bot
                      size={19}
                    />

                  </div>

                  <span>
                    Live
                  </span>

                </div>

                <p>
                  Active AI Agents
                </p>

                <h3 className="blue-number">

                  {dashboardLoading
                    ? "..."
                    : String(
                        activeAgents
                      ).padStart(
                        2,
                        "0"
                      )}

                </h3>

                <small>
                  {totalAgents} total agents
                </small>

              </div>

              {/* SYSTEM STATUS */}

              <div className="ob-stat-card">

                <div className="stat-top">

                  <div className="stat-icon green">

                    <Activity
                      size={20}
                    />

                  </div>

                  <span>
                    {systemStatus}
                  </span>

                </div>

                <p>
                  System Status
                </p>

                <h3 className="green-number">

                  {dashboardLoading
                    ? "..."
                    : systemHealthy
                    ? "OK"
                    : "!"}

                </h3>

                <small>
                  {idleAgents} idle Â·{" "}
                  {errorAgents} errors
                </small>

              </div>

              {/* TASKS */}

              <div className="ob-stat-card">

                <div className="stat-top">

                  <div className="stat-icon purple">

                    <BarChart3
                      size={19}
                    />

                  </div>

                  <span>
                    Live
                  </span>

                </div>

                <p>
                  Tasks Processed
                </p>

                <h3 className="purple-number">

                  {dashboardLoading
                    ? "..."
                    : totalTasks.toLocaleString()}

                </h3>

                <small>
                  Total processed tasks
                </small>

              </div>

              {/* HEALTH */}

              <div className="ob-stat-card">

                <div className="stat-top">

                  <div className="stat-icon orange">

                    <ShieldCheck
                      size={19}
                    />

                  </div>

                  <span>
                    Live
                  </span>

                </div>

                <p>
                  System Health
                </p>

                <h3 className="orange-number">

                  {dashboardLoading
                    ? "..."
                    : `${safeHealth}%`}

                </h3>

                <small>
                  Current agent health
                </small>

              </div>

            </section>

            {/* =================================================
                AGENT ACTIVITY + SYSTEM HEALTH
                ================================================= */}

            <section className="ob-main-grid">

              {/* AGENT ACTIVITY */}

              <div className="ob-panel">

                <div className="panel-header">

                  <div className="panel-heading">

                    <h2>
                      Agent Activity
                    </h2>

                    <span className="live-badge">

                      <i></i>

                      Live

                    </span>

                  </div>

                  <button
                    className="view-button"
                    onClick={() =>
                      setActiveMenu(
                        "AI Agents"
                      )
                    }
                  >

                    View all

                    <ChevronRight
                      size={15}
                    />

                  </button>

                </div>

                <div className="agent-list">

                  {dashboardLoading ? (

                    <div
                      style={{
                        padding:
                          "25px",
                        textAlign:
                          "center",
                        fontSize:
                          "13px",
                      }}
                    >
                      Loading agents...
                    </div>

                  ) : agents.length ===
                    0 ? (

                    <div
                      style={{
                        padding:
                          "25px",
                        textAlign:
                          "center",
                        fontSize:
                          "13px",
                      }}
                    >
                      No AI agents created yet.
                    </div>

                  ) : (

                    agents
                      .slice(0, 5)
                      .map(
                        (
                          agent,
                          index
                        ) => {

                          const status =
                            agent?.status ||
                            "Idle";

                          const colorClasses =
                            [
                              "blue",
                              "green",
                              "purple",
                              "orange",
                              "support",
                            ];

                          const iconColor =
                            colorClasses[
                              index %
                                colorClasses.length
                            ];

                          return (

                            <div
                              className="agent-row"
                              key={
                                agent?.id ||
                                agent?.name ||
                                index
                              }
                            >

                              <div
                                className={`agent-icon ${iconColor}`}
                              >

                                {getAgentIcon(
                                  agent
                                )}

                              </div>

                              <div className="agent-details">

                                <strong>
                                  {agent?.name ||
                                    "Unnamed Agent"}
                                </strong>

                                <span>
                                  {agent?.description ||
                                    "AI agent operational"}
                                </span>

                              </div>

                              <div className="agent-status">

                                <div>

                                  <strong>
                                    {status}
                                  </strong>

                                  <small>
                                    {agent?.last_activity ||
                                      agent?.lastActivity ||
                                      "No activity recorded"}
                                  </small>

                                </div>

                                <i></i>

                              </div>

                            </div>

                          );
                        }
                      )

                  )}

                </div>

              </div>

              {/* SYSTEM HEALTH */}

              <div className="ob-panel">

                <div className="panel-header">

                  <h2>
                    System Health
                  </h2>

                  <button
                    className="view-button"
                    onClick={() =>
                      setActiveMenu(
                        "Monitoring"
                      )
                    }
                  >

                    View all

                    <ChevronRight
                      size={15}
                    />

                  </button>

                </div>

                <div className="health-list">

                  {services.map(
                    (service) => {

                      const isOffline =
                        String(
                          service.status
                        )
                          .toLowerCase()
                          .includes(
                            "offline"
                          );

                      return (

                        <div
                          className="health-row"
                          key={
                            service.name
                          }
                        >

                          <div className="health-icon">

                            <ShieldCheck
                              size={17}
                            />

                          </div>

                          <div>

                            <strong>
                              {service.name}
                            </strong>

                            <span>
                              {
                                service.description
                              }
                            </span>

                          </div>

                          <em
                            style={{
                              color:
                                isOffline
                                  ? "#dc2626"
                                  : undefined,
                            }}
                          >

                            {
                              service.status
                            }

                          </em>

                        </div>

                      );
                    }
                  )}

                </div>

                <div className="health-summary">

                  <div
                    className="health-circle"
                    style={{
                      "--health": `${safeHealth}%`,
                    }}
                  >

                    <span>

                      {dashboardLoading
                        ? "..."
                        : `${safeHealth}%`}

                    </span>

                  </div>

                  <div>

                    <strong>
                      Overall System Health
                    </strong>

                    <span>
                      {systemHealthy
                        ? "No agent errors detected"
                        : "Some components require attention"}
                    </span>

                    <small>
                      Auto-refresh:{" "}
                      {refreshDisplayText}
                    </small>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                ANALYTICS + QUICK ACTIONS
                ================================================= */}

            <section className="ob-bottom-grid">

              {/* ANALYTICS */}

              <div className="ob-panel analytics-panel">

                <div className="panel-header">

                  <h2>
                    Agent Task Overview
                  </h2>

                  <button
                    className="period-button"
                    onClick={() =>
                      setActiveMenu(
                        "Analytics"
                      )
                    }
                  >

                    View Analytics

                  </button>

                </div>

                {chartData.length ===
                0 ? (

                  <div
                    style={{
                      padding:
                        "35px 10px",
                      textAlign:
                        "center",
                      color:
                        "#8994a6",
                      fontSize:
                        "13px",
                    }}
                  >

                    Create agents and
                    process tasks to
                    generate analytics.

                  </div>

                ) : (

                  <div className="chart">

                    <div className="chart-y">

                      <span>
                        Tasks
                      </span>

                    </div>

                    <div className="chart-area">

                      <div className="grid-line line-1"></div>

                      <div className="grid-line line-2"></div>

                      <div className="grid-line line-3"></div>

                      <div className="grid-line line-4"></div>

                      <div className="bars">

                        {chartData.map(
                          (item) => (

                            <div
                              key={
                                item.label
                              }
                            >

                              <span
                                title={`${item.label}: ${item.value} tasks`}
                                style={{
                                  height:
                                    item.height,
                                }}
                              ></span>

                              <small>
                                {
                                  item.label
                                }
                              </small>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  </div>

                )}

              </div>

              {/* QUICK ACTIONS */}

              <div className="ob-panel quick-panel">

                <div className="panel-header">

                  <h2>
                    Quick Actions
                  </h2>

                </div>

                {/* ADD AGENT */}

                <button
                  className="quick-action"
                  onClick={() =>
                    setActiveMenu(
                      "AI Agents"
                    )
                  }
                >

                  <div className="quick-icon blue">

                    <Plus
                      size={20}
                    />

                  </div>

                  <div>

                    <strong>
                      Add New AI Agent
                    </strong>

                    <span>
                      Deploy a new intelligent agent
                    </span>

                  </div>

                  <ChevronRight
                    size={16}
                  />

                </button>

                {/* ANALYTICS */}

                <button
                  className="quick-action"
                  onClick={() =>
                    setActiveMenu(
                      "Analytics"
                    )
                  }
                >

                  <div className="quick-icon green">

                    <BarChart3
                      size={19}
                    />

                  </div>

                  <div>

                    <strong>
                      View Analytics
                    </strong>

                    <span>
                      Explore system analytics
                    </span>

                  </div>

                  <ChevronRight
                    size={16}
                  />

                </button>

                {/* ALERTS */}

                <button
                  className="quick-action"
                  onClick={() =>
                    setActiveMenu(
                      "Alerts"
                    )
                  }
                >

                  <div className="quick-icon purple">

                    <Bell
                      size={19}
                    />

                  </div>

                  <div>

                    <strong>
                      System Alerts
                    </strong>

                    <span>
                      View system alerts and notifications
                    </span>

                  </div>

                  {alertCount >
                    0 && (

                    <span className="quick-alert">

                      {alertCount}

                    </span>

                  )}

                </button>

                {/* SETTINGS */}

                <button
                  className="quick-action"
                  onClick={() =>
                    setActiveMenu(
                      "Settings"
                    )
                  }
                >

                  <div className="quick-icon orange">

                    <Settings
                      size={19}
                    />

                  </div>

                  <div>

                    <strong>
                      System Settings
                    </strong>

                    <span>
                      Configure system preferences
                    </span>

                  </div>

                  <ChevronRight
                    size={16}
                  />

                </button>

              </div>

            </section>

            {/* =================================================
                OMNIBRAIN AI ASSISTANT
                ================================================= */}

            <section className="ai-chat">

              {/* CHAT HEADER */}

              <div className="ai-chat-top">

                <div className="ai-chat-brand">

                  <div className="ai-chat-icon">

                    <Sparkles
                      size={20}
                    />

                  </div>

                  <div>

                    <span className="ai-chat-label">
                      OMNIBRAIN AI
                    </span>

                    <h2>
                      AI Assistant
                    </h2>

                  </div>

                </div>

                <div className="chat-online">

                  <span></span>

                  Online

                </div>

              </div>

              {/* DEFAULT MESSAGE */}

              {!chatReply &&
                !chatLoading && (

                  <div className="ai-chat-description">

                    <div className="ai-bot-icon">

                      <Bot
                        size={18}
                      />

                    </div>

                    <div>

                      <strong>
                        How can I help you?
                      </strong>

                      <p>
                        Ask questions about
                        industrial safety,
                        systems, agents,
                        operations and your
                        knowledge base.
                      </p>

                    </div>

                  </div>

                )}

              {/* LOADING */}

              {chatLoading && (

                <div className="ai-chat-response">

                  <Bot
                    size={17}
                  />

                  <p>
                    OmniBrain is searching
                    the knowledge base and
                    generating an answer...
                  </p>

                </div>

              )}

              {/* RESPONSE */}

              {chatReply && (

                <div className="ai-chat-response">

                  <Bot
                    size={17}
                  />

                  <div>

                    {/* AI AGENT */}

                    {chatAgent && (

                      <div className="chat-agent-badge">

                        <Bot
                          size={13}
                        />

                        <span>
                          {chatAgent}
                        </span>

                      </div>

                    )}

                    {/* ANSWER */}

                    <div
                      className="ai-chat-formatted-response"
                      style={{
                        fontSize:
                          "14px",
                        lineHeight:
                          "1.65",
                        color:
                          "#4b5563",
                        whiteSpace:
                          "normal",
                      }}
                    >

                      {formatAIResponse(
                        chatReply
                      )}

                    </div>

                    {/* SOURCES */}

                    {chatSources.length >
                      0 && (

                      <div className="chat-sources">

                        <strong>
                          Knowledge Sources
                        </strong>

                        <div className="source-list">

                          {[
                            ...new Set(
                              chatSources.filter(
                                Boolean
                              )
                            ),
                          ].map(
                            (
                              source,
                              index
                            ) => (

                              <span
                                className="source-item"
                                key={`${source}-${index}`}
                              >

                                <Database
                                  size={13}
                                />

                                {source}

                              </span>

                            )
                          )}

                        </div>

                      </div>

                    )}

                  </div>

                </div>

              )}

              {/* INPUT */}

              <div className="ai-chat-input">

                <input
                  type="text"
                  placeholder="Ask OmniBrain AI..."
                  value={
                    chatMessage
                  }
                  disabled={
                    chatLoading
                  }
                  onChange={(event) =>
                    setChatMessage(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {

                      event.preventDefault();

                      sendMessage();

                    }

                  }}
                />

                <button
                  onClick={
                    sendMessage
                  }
                  disabled={
                    chatLoading ||
                    !chatMessage.trim()
                  }
                >

                  <Sparkles
                    size={16}
                  />

                  {chatLoading
                    ? "Thinking..."
                    : "Ask AI"}

                </button>

              </div>

            </section>

            {/* =================================================
                FOOTER
                ================================================= */}

            <footer className="ob-footer">

              <span>
                Â© 2026 OmniBrain Intelligence Platform
              </span>

              <span>

                <i></i>

                {systemStatus ===
                "Healthy"
                  ? "All systems operational"
                  : "System requires attention"}

              </span>

              <span>
                v2.1.0
              </span>

            </footer>

          </>

        )}

        {/* ======================================================
            SEARCH PANEL
            ====================================================== */}

        {showSearch && (

          <SearchPanel
  onClose={() =>
    setShowSearch(false)
  }
  onNavigate={(menu) =>
    setActiveMenu(menu)
  }
/>
        )}

        {/* ======================================================
            NOTIFICATION PANEL
            ====================================================== */}

        {showNotifications && (

          <NotificationPanel
            onClose={() =>
              setShowNotifications(
                false
              )
            }
          />

        )}

        {/* ======================================================
            PROFILE PANEL
            ====================================================== */}

        {showProfile && (

          <ProfilePanel
  onClose={() =>
    setShowProfile(false)
  }
  onLogout={logout}
  onSettings={() => {
    setActiveMenu("Settings");
  }}
/>

        )}

      </main>

    </div>
  );
}

export default Dashboard;

