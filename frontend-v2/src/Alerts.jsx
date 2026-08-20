import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  Activity,
  Bot,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const ALERT_HISTORY_KEY =
  "omnibrain_recent_system_events";

const MAX_RECENT_EVENTS = 30;

function Alerts() {
  // ============================================================
  // STATE
  // ============================================================

  const [agents, setAgents] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [recentEvents, setRecentEvents] =
    useState([]);

  // ============================================================
  // STATUS HELPERS
  // ============================================================

  const normalizeStatus = (status) =>
    String(status || "idle")
      .trim()
      .toLowerCase();

  const getAgentHealth = (agent) => {
    const value = Number(
      agent?.health ??
        agent?.health_score ??
        100
    );

    if (!Number.isFinite(value)) {
      return 100;
    }

    return Math.min(
      Math.max(Math.round(value), 0),
      100
    );
  };

  const getAgentTasks = (agent) => {
    const value = Number(
      agent?.tasks ??
        agent?.total_tasks ??
        0
    );

    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(value, 0);
  };

  // ============================================================
  // AGENT IDENTIFIER
  // ============================================================

  const getAgentId = (agent, index = 0) => {
    return (
      agent?.id ||
      agent?.name ||
      `agent-${index}`
    );
  };

  // ============================================================
  // AUTHENTICATION FAILURE
  // ============================================================

  const handleAuthenticationFailure =
    useCallback(() => {
      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "user_email"
      );

      window.location.href = "/";
    }, []);

  // ============================================================
  // LOAD SAVED EVENTS
  // ============================================================

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          ALERT_HISTORY_KEY
        );

      if (!stored) {
        return;
      }

      const parsed =
        JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setRecentEvents(
          parsed.slice(
            0,
            MAX_RECENT_EVENTS
          )
        );
      }
    } catch (err) {
      console.error(
        "Unable to load saved system events:",
        err
      );
    }
  }, []);

  // ============================================================
  // SAVE EVENTS
  // ============================================================

  const saveRecentEvents = useCallback(
    (events) => {
      try {
        const limited =
          events.slice(
            0,
            MAX_RECENT_EVENTS
          );

        localStorage.setItem(
          ALERT_HISTORY_KEY,
          JSON.stringify(limited)
        );

        setRecentEvents(limited);
      } catch (err) {
        console.error(
          "Unable to save system events:",
          err
        );
      }
    },
    []
  );

  // ============================================================
  // ADD EVENT
  // ============================================================

  const addRecentEvent =
    useCallback(
      (event) => {
        setRecentEvents(
          (previous) => {
            // --------------------------------------------------
            // Prevent duplicate events
            // --------------------------------------------------

            const duplicate =
              previous.some(
                (item) =>
                  item.id ===
                  event.id
              );

            if (duplicate) {
              return previous;
            }

            const updated = [
              event,
              ...previous,
            ].slice(
              0,
              MAX_RECENT_EVENTS
            );

            try {
              localStorage.setItem(
                ALERT_HISTORY_KEY,
                JSON.stringify(
                  updated
                )
              );
            } catch (err) {
              console.error(
                "Unable to persist system event:",
                err
              );
            }

            return updated;
          }
        );
      },
      []
    );

  // ============================================================
  // LOAD AGENTS
  // ============================================================

  const loadAgents = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          setError(
            "Authentication required."
          );

          return;
        }

        const response =
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

        // ======================================================
        // AUTH ERROR
        // ======================================================

        if (
          response.status === 401
        ) {
          handleAuthenticationFailure();
          return;
        }

        // ======================================================
        // READ RESPONSE
        // ======================================================

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        // ======================================================
        // API ERROR
        // ======================================================

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Unable to load agent information."
          );
        }

        // ======================================================
        // NORMALIZE AGENTS
        // ======================================================

        const loadedAgents =
          Array.isArray(data)
            ? data
            : [];

        setAgents(
          loadedAgents
        );

        // ======================================================
        // CREATE CURRENT SYSTEM EVENTS
        // ======================================================

        loadedAgents.forEach(
          (agent, index) => {
            const name =
              agent?.name ||
              "Unnamed Agent";

            const agentId =
              getAgentId(
                agent,
                index
              );

            const status =
              normalizeStatus(
                agent?.status
              );

            const health =
              getAgentHealth(
                agent
              );

            const tasks =
              getAgentTasks(
                agent
              );

            // --------------------------------------------------
            // ERROR
            // --------------------------------------------------

            if (
              status === "error" ||
              status === "failed" ||
              status === "offline"
            ) {
              addRecentEvent({
                id: `error-${agentId}`,
                title:
                  `${name} requires attention`,
                message:
                  `Agent status is ${
                    agent?.status ||
                    "Error"
                  }. Check the agent configuration and service availability.`,
                type: "error",
                agentId,
                timestamp:
                  new Date().toISOString(),
              });

              return;
            }

            // --------------------------------------------------
            // LOW HEALTH
            // --------------------------------------------------

            if (
              health < 70
            ) {
              addRecentEvent({
                id: `health-${agentId}-${health}`,
                title:
                  `${name} health is low`,
                message:
                  `Current agent health is ${health}%. Please investigate the agent.`,
                type: "warning",
                agentId,
                timestamp:
                  new Date().toISOString(),
              });
            }

            // --------------------------------------------------
            // RUNNING / ACTIVE
            // --------------------------------------------------

            if (
              status === "running" ||
              status === "active"
            ) {
              addRecentEvent({
                id: `running-${agentId}`,
                title:
                  `${name} is running`,
                message:
                  `The ${
                    agent?.category ||
                    "AI"
                  } agent is currently active and processing operations.`,
                type: "success",
                agentId,
                timestamp:
                  new Date().toISOString(),
              });
            }

            // --------------------------------------------------
            // IDLE
            // --------------------------------------------------

            if (
              status === "idle"
            ) {
              addRecentEvent({
                id: `idle-${agentId}`,
                title:
                  `${name} is idle`,
                message:
                  "The agent is available but is not currently processing operations.",
                type: "info",
                agentId,
                timestamp:
                  new Date().toISOString(),
              });
            }

            // --------------------------------------------------
            // TASK ACTIVITY
            // --------------------------------------------------

            if (
              tasks > 0
            ) {
              addRecentEvent({
                id: `tasks-${agentId}-${tasks}`,
                title:
                  `${name} processed tasks`,
                message:
                  `This agent has processed ${tasks} task${
                    tasks === 1
                      ? ""
                      : "s"
                  } successfully.`,
                type: "success",
                agentId,
                timestamp:
                  new Date().toISOString(),
              });
            }
          }
        );

        // ======================================================
        // NO AGENTS
        // ======================================================

        if (
          loadedAgents.length ===
          0
        ) {
          addRecentEvent({
            id: "no-agents",
            title:
              "No AI agents configured",
            message:
              "There are currently no AI agents available in the workspace.",
            type: "info",
            timestamp:
              new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(
          "Alerts loading error:",
          err
        );

        setError(
          err?.message ||
            "Unable to connect to the monitoring service."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      addRecentEvent,
      handleAuthenticationFailure,
    ]
  );

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    loadAgents();

    const interval =
      setInterval(() => {
        loadAgents(false);
      }, 10000);

    return () =>
      clearInterval(interval);
  }, [loadAgents]);

  // ============================================================
  // RUNNING AGENTS
  // ============================================================

  const runningAgents =
    useMemo(() => {
      return agents.filter(
        (agent) => {
          const status =
            normalizeStatus(
              agent?.status
            );

          return (
            status === "running" ||
            status === "active"
          );
        }
      );
    }, [agents]);

  // ============================================================
  // AGENTS REQUIRING ATTENTION
  // ============================================================

  const attentionAgents =
    useMemo(() => {
      return agents.filter(
        (agent) => {
          const status =
            normalizeStatus(
              agent?.status
            );

          const health =
            getAgentHealth(agent);

          return (
            status === "error" ||
            status === "failed" ||
            status === "offline" ||
            health < 70
          );
        }
      );
    }, [agents]);

  // ============================================================
  // TOTAL TASKS
  // ============================================================

  const totalTasks =
    useMemo(() => {
      return agents.reduce(
        (total, agent) =>
          total +
          getAgentTasks(agent),
        0
      );
    }, [agents]);

  // ============================================================
  // AVERAGE HEALTH
  // ============================================================

  const averageHealth =
    useMemo(() => {
      if (
        agents.length === 0
      ) {
        return 0;
      }

      const total =
        agents.reduce(
          (sum, agent) =>
            sum +
            getAgentHealth(
              agent
            ),
          0
        );

      return Math.round(
        total /
          agents.length
      );
    }, [agents]);

  // ============================================================
  // SYSTEM HEALTH
  // ============================================================

  const systemHealthy =
    agents.length > 0 &&
    attentionAgents.length ===
      0 &&
    averageHealth >= 80;

  // ============================================================
  // DISPLAY EVENTS
  // ============================================================

  const alerts = useMemo(() => {
    if (
      recentEvents.length >
      0
    ) {
      return recentEvents;
    }

    if (
      agents.length === 0
    ) {
      return [
        {
          id: "no-agents-fallback",
          title:
            "No AI agents configured",
          message:
            "There are currently no AI agents available in the workspace.",
          type: "info",
        },
      ];
    }

    return [];
  }, [
    recentEvents,
    agents.length,
  ]);

  // ============================================================
  // ICON
  // ============================================================

  const getAlertIcon = (
    type
  ) => {
    switch (type) {
      case "error":
        return AlertTriangle;

      case "warning":
        return AlertTriangle;

      case "success":
        return CheckCircle2;

      default:
        return Activity;
    }
  };

  // ============================================================
  // ALERT COLORS
  // ============================================================

  const getAlertStyle = (
    type
  ) => {
    switch (type) {
      case "error":
        return {
          background:
            "#fff1f2",
          color:
            "#dc3545",
        };

      case "warning":
        return {
          background:
            "#fff7ed",
          color:
            "#ed8b3d",
        };

      case "success":
        return {
          background:
            "#e8f8f1",
          color:
            "#20a77d",
        };

      default:
        return {
          background:
            "#edf6ff",
          color:
            "#2879df",
        };
    }
  };

  // ============================================================
  // MAIN UI
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
              Alerts
            </strong>

          </div>

          <h1>
            System Alerts
          </h1>

          <p>
            Review important events and
            real-time system notifications.
          </p>

        </div>

        {/* REFRESH */}

        <button
          type="button"
          onClick={() =>
            loadAgents(true)
          }
          disabled={refreshing}
          style={{
            border:
              "1px solid #dfe5ed",
            background:
              "#fff",
            color:
              "#2879df",
            padding:
              "10px 14px",
            borderRadius:
              "9px",
            display:
              "flex",
            alignItems:
              "center",
            gap:
              "7px",
            cursor:
              refreshing
                ? "not-allowed"
                : "pointer",
            opacity:
              refreshing
                ? 0.7
                : 1,
          }}
        >

          {refreshing ? (
            <Loader2
              size={16}
              className="spin"
            />
          ) : (
            <RefreshCw
              size={16}
            />
          )}

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div
          style={{
            background:
              "#fff1f2",
            border:
              "1px solid #fecdd3",
            color:
              "#c62828",
            padding:
              "13px 15px",
            borderRadius:
              "9px",
            marginBottom:
              "18px",
            fontSize:
              "12px",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================================
          SUMMARY CARDS
          ====================================================== */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap:
            "18px",
          marginBottom:
            "20px",
        }}
      >

        {/* MONITORED AGENTS */}

        <div
          style={{
            background:
              "#fff",
            border:
              "1px solid #e7ecf2",
            borderRadius:
              "14px",
            padding:
              "20px",
          }}
        >

          <Bot
            size={22}
            color="#2879df"
          />

          <p
            style={{
              color:
                "#7e8a9d",
              fontSize:
                "12px",
            }}
          >
            Monitored Agents
          </p>

          <h2
            style={{
              margin:
                0,
              color:
                "#17243c",
            }}
          >
            {loading
              ? "..."
              : agents.length}
          </h2>

        </div>

        {/* RUNNING AGENTS */}

        <div
          style={{
            background:
              "#fff",
            border:
              "1px solid #e7ecf2",
            borderRadius:
              "14px",
            padding:
              "20px",
          }}
        >

          <Activity
            size={22}
            color="#20a77d"
          />

          <p
            style={{
              color:
                "#7e8a9d",
              fontSize:
                "12px",
            }}
          >
            Running Agents
          </p>

          <h2
            style={{
              margin:
                0,
              color:
                "#17243c",
            }}
          >
            {loading
              ? "..."
              : runningAgents.length}
          </h2>

        </div>

        {/* ATTENTION */}

        <div
          style={{
            background:
              "#fff",
            border:
              "1px solid #e7ecf2",
            borderRadius:
              "14px",
            padding:
              "20px",
          }}
        >

          <Bell
            size={22}
            color={
              attentionAgents.length >
              0
                ? "#dc3545"
                : "#20a77d"
            }
          />

          <p
            style={{
              color:
                "#7e8a9d",
              fontSize:
                "12px",
            }}
          >
            Agents Requiring Attention
          </p>

          <h2
            style={{
              margin:
                0,
              color:
                attentionAgents.length >
                0
                  ? "#dc3545"
                  : "#20a77d",
            }}
          >
            {loading
              ? "..."
              : attentionAgents.length}
          </h2>

        </div>

      </div>

      {/* ======================================================
          RECENT EVENTS
          ====================================================== */}

      <div
        style={{
          background:
            "#fff",
          border:
            "1px solid #e7ecf2",
          borderRadius:
            "14px",
          padding:
            "20px",
        }}
      >

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap:
              "9px",
            marginBottom:
              "10px",
          }}
        >

          <ShieldCheck
            size={19}
            color="#2879df"
          />

          <h2
            style={{
              margin:
                0,
              fontSize:
                "16px",
            }}
          >
            Recent System Events
          </h2>

        </div>

        {/* LOADING */}

        {loading ? (

          <div
            style={{
              padding:
                "45px 20px",
              textAlign:
                "center",
              color:
                "#8994a6",
              fontSize:
                "12px",
            }}
          >

            <Loader2
              size={27}
              className="spin"
            />

            <p>
              Loading system alerts...
            </p>

          </div>

        ) : alerts.length ===
          0 ? (

          <div
            style={{
              padding:
                "45px 20px",
              textAlign:
                "center",
              color:
                "#8994a6",
              fontSize:
                "12px",
            }}
          >

            <CheckCircle2
              size={32}
              color="#20a77d"
            />

            <p>
              No system events to report.
            </p>

          </div>

        ) : (

          alerts.map(
            (
              alert,
              index
            ) => {

              const Icon =
                getAlertIcon(
                  alert.type
                );

              const style =
                getAlertStyle(
                  alert.type
                );

              return (
                <div
                  key={
                    alert.id
                  }
                  style={{
                    display:
                      "flex",
                    gap:
                      "15px",
                    padding:
                      "18px 5px",
                    borderBottom:
                      index ===
                      alerts.length - 1
                        ? "none"
                        : "1px solid #f0f2f5",
                  }}
                >

                  <div
                    style={{
                      width:
                        "42px",
                      height:
                        "42px",
                      borderRadius:
                        "10px",
                      background:
                        style.background,
                      color:
                        style.color,
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      flexShrink:
                        0,
                    }}
                  >

                    <Icon
                      size={20}
                    />

                  </div>

                  <div
                    style={{
                      flex:
                        1,
                    }}
                  >

                    <strong
                      style={{
                        color:
                          "#263249",
                        fontSize:
                          "13px",
                      }}
                    >
                      {alert.title}
                    </strong>

                    <p
                      style={{
                        margin:
                          "5px 0 0",
                        color:
                          "#7e8a9d",
                        fontSize:
                          "11px",
                        lineHeight:
                          "1.5",
                      }}
                    >
                      {alert.message}
                    </p>

                  </div>

                </div>
              );
            }
          )

        )}

      </div>

      {/* ======================================================
          MONITORING STATUS
          ====================================================== */}

      <div
        style={{
          marginTop:
            "20px",
          background:
            systemHealthy
              ? "#f8fbff"
              : "#fff7ed",
          border:
            systemHealthy
              ? "1px solid #dcecff"
              : "1px solid #fed7aa",
          borderRadius:
            "14px",
          padding:
            "18px",
          display:
            "flex",
          alignItems:
            "center",
          gap:
            "12px",
        }}
      >

        {systemHealthy ? (
          <ShieldCheck
            size={20}
            color="#2879df"
          />
        ) : (
          <AlertTriangle
            size={20}
            color="#ed8b3d"
          />
        )}

        <div>

          <strong
            style={{
              fontSize:
                "12px",
            }}
          >
            {systemHealthy
              ? "Monitoring protection enabled"
              : "Monitoring requires attention"}
          </strong>

          <p
            style={{
              margin:
                "4px 0 0",
              color:
                "#7e8a9d",
              fontSize:
                "10px",
            }}
          >
            OmniBrain continuously checks
            agent status and health every
            10 seconds.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Alerts;

