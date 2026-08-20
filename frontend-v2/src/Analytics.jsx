import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  Bot,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Clock3,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [agents, setAgents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // LOAD ANALYTICS
  // ============================================================

  const loadAnalytics = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token =
          localStorage.getItem("access_token");

        if (!token) {
          setError(
            "Authentication required."
          );

          setLoading(false);
          setRefreshing(false);

          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // ======================================================
        // ANALYTICS API
        // ======================================================

        const response = await fetch(
          `${API_URL}/agents/analytics`,
          {
            method: "GET",
            headers,
          }
        );

        const data =
          await response
            .json()
            .catch(() => ({}));

        // ======================================================
        // AUTH ERROR
        // ======================================================

        if (response.status === 401) {
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "user_email"
          );

          window.location.href = "/";

          return;
        }

        // ======================================================
        // API ERROR
        // ======================================================

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              `Analytics request failed: ${response.status}`
          );
        }

        // ======================================================
        // SAVE ANALYTICS
        // ======================================================

        setAnalytics(data || {});

        // ======================================================
        // GET AGENTS
        //
        // Some backend versions return agents inside
        // analytics while others require /agents/.
        // ======================================================

        if (
          Array.isArray(data?.agents)
        ) {
          setAgents(data.agents);
        } else {
          const agentsResponse =
            await fetch(
              `${API_URL}/agents/`,
              {
                method: "GET",
                headers,
              }
            );

          if (
            agentsResponse.status ===
            401
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

          if (agentsResponse.ok) {
            const agentsData =
              await agentsResponse.json();

            setAgents(
              Array.isArray(
                agentsData
              )
                ? agentsData
                : []
            );
          } else {
            setAgents([]);
          }
        }
      } catch (err) {
        console.error(
          "Analytics error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load analytics. Please make sure the backend is running."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
  loadAnalytics();

  const getRefreshSettings = () => {
    try {
      const stored = localStorage.getItem(
        "omnibrain_settings"
      );

      if (!stored) {
        return {
          autoRefresh: true,
          refreshInterval: 30,
        };
      }

      const settings = JSON.parse(stored);

      return {
        autoRefresh:
          settings.autoRefresh ?? true,

        refreshInterval:
          Number(settings.refreshInterval) >= 5
            ? Number(settings.refreshInterval)
            : 30,
      };
    } catch {
      return {
        autoRefresh: true,
        refreshInterval: 30,
      };
    }
  };

  let interval;

  const startAutoRefresh = () => {
    if (interval) {
      clearInterval(interval);
    }

    const settings = getRefreshSettings();

    if (!settings.autoRefresh) {
      return;
    }

    interval = setInterval(() => {
      loadAnalytics(false);
    }, settings.refreshInterval * 1000);
  };

  startAutoRefresh();

  const handleSettingsChange = () => {
    startAutoRefresh();
  };

  window.addEventListener(
    "omnibrain-settings-changed",
    handleSettingsChange
  );

  return () => {
    if (interval) {
      clearInterval(interval);
    }

    window.removeEventListener(
      "omnibrain-settings-changed",
      handleSettingsChange
    );
  };
}, [loadAnalytics]);
  // ============================================================
  // SAFE ANALYTICS DATA
  // ============================================================

  const data = analytics || {};

  // ============================================================
  // STATISTICS OBJECT
  //
  // Supports both:
  //
  // {
  //   total_agents: 1
  // }
  //
  // and:
  //
  // {
  //   statistics: {
  //      total_agents: 1
  //   }
  // }
  // ============================================================

  const statistics =
    data.statistics || {};

  // ============================================================
  // NORMALIZE STATUS
  // ============================================================

  const normalizeStatus = (
    status
  ) =>
    String(
      status || ""
    )
      .trim()
      .toLowerCase();

  // ============================================================
  // NORMALIZE AGENT HEALTH
  // ============================================================

  const getHealth = (agent) => {
    const value = Number(
      agent?.health ??
        agent?.health_score ??
        100
    );

    if (!Number.isFinite(value)) {
      return 100;
    }

    return Math.min(
      Math.max(
        Math.round(value),
        0
      ),
      100
    );
  };

  // ============================================================
  // NORMALIZE TASK COUNT
  // ============================================================

  const getTasks = (agent) => {
    const value = Number(
      agent?.tasks ??
        agent?.total_tasks ??
        agent?.tasks_processed ??
        0
    );

    return Number.isFinite(value)
      ? Math.max(0, value)
      : 0;
  };

  // ============================================================
  // AGENT COUNTS
  // ============================================================

  const totalAgents =
    Number(
      statistics.total_agents ??
        data.total_agents ??
        agents.length
    );

  const runningAgents =
    Number(
      statistics.running_agents ??
        statistics.active_agents ??
        data.running_agents ??
        data.active_agents ??
        agents.filter(
          (agent) => {
            const status =
              normalizeStatus(
                agent.status
              );

            return (
              status ===
                "running" ||
              status ===
                "active"
            );
          }
        ).length
    );

  const totalTasks =
    Number(
      statistics.total_tasks ??
        data.total_tasks ??
        agents.reduce(
          (sum, agent) =>
            sum + getTasks(agent),
          0
        )
    );

  const errorAgents =
    Number(
      statistics.error_agents ??
        data.error_agents ??
        agents.filter(
          (agent) => {
            const status =
              normalizeStatus(
                agent.status
              );

            const health =
              getHealth(agent);

            return (
              status === "error" ||
              status === "failed" ||
              status === "offline" ||
              health < 70
            );
          }
        ).length
    );

  // ============================================================
  // AVERAGE HEALTH
  // ============================================================

  const calculatedAverageHealth =
    agents.length > 0
      ? Math.round(
          agents.reduce(
            (sum, agent) =>
              sum +
              getHealth(agent),
            0
          ) /
            agents.length
        )
      : 0;

  const averageHealth = Math.min(
    Math.max(
      Number(
        statistics.average_health ??
          data.average_health ??
          calculatedAverageHealth
      ),
      0
    ),
    100
  );

  // ============================================================
  // SYSTEM STATUS
  // ============================================================

  const systemHealthy =
    errorAgents === 0 &&
    averageHealth >= 80;

  // ============================================================
  // CATEGORY DATA
  // ============================================================

  const categories = useMemo(() => {
    if (
      data.categories &&
      typeof data.categories ===
        "object"
    ) {
      return data.categories;
    }

    const result = {};

    agents.forEach((agent) => {
      const category =
        agent.category ||
        "General";

      result[category] =
        (result[category] || 0) +
        1;
    });

    return result;
  }, [data.categories, agents]);

  // ============================================================
  // PERFORMANCE ORDER
  // ============================================================

  const sortedAgents = useMemo(() => {
    return [...agents].sort(
      (a, b) =>
        getTasks(b) -
        getTasks(a)
    );
  }, [agents]);

  // ============================================================
  // MAX TASKS FOR BAR CHART
  // ============================================================

  const maxTasks = Math.max(
    ...agents.map(getTasks),
    1
  );

  // ============================================================
  // STAT CARDS
  // ============================================================

  const stats = [
    {
      title: "Total Agents",
      value: totalAgents,
      icon: Bot,
      color: "#2879df",
      background: "#edf6ff",
    },
    {
      title: "Active Agents",
      value: runningAgents,
      icon: CheckCircle2,
      color: "#20a77d",
      background: "#e8f8f1",
    },
    {
      title: "Tasks Processed",
      value:
        totalTasks.toLocaleString(),
      icon: BarChart3,
      color: "#8250d6",
      background: "#f3edff",
    },
    {
      title: "Average Health",
      value: `${Math.round(
        averageHealth
      )}%`,
      icon: Activity,
      color:
        averageHealth >= 80
          ? "#20a77d"
          : averageHealth >= 50
          ? "#ed8b3d"
          : "#ef5350",
      background:
        averageHealth >= 80
          ? "#e8f8f1"
          : "#fff7ed",
    },
  ];

  // ============================================================
  // HEADER
  // ============================================================

  const Header = () => (
    <div className="ob-header">
      <div>
        <div className="ob-breadcrumb">
          <span>
            Workspace
          </span>

          <b>/</b>

          <strong>
            Analytics
          </strong>
        </div>

        <h1>
          Analytics Overview
        </h1>

        <p>
          Analyze agent activity and
          operational performance.
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          loadAnalytics(true)
        }
        disabled={refreshing}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border:
            "1px solid #dfe5ed",
          background: "#fff",
          color: "#2879df",
          padding:
            "10px 15px",
          borderRadius: "9px",
          cursor: refreshing
            ? "not-allowed"
            : "pointer",
          fontWeight: 600,
        }}
      >
        {refreshing ? (
          <Loader2
            size={16}
            className="spin"
          />
        ) : (
          <RefreshCw size={16} />
        )}

        {refreshing
          ? "Refreshing..."
          : "Refresh"}
      </button>
    </div>
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div>
        <Header />

        <div
          style={{
            background: "#fff",
            border:
              "1px solid #e7ecf2",
            borderRadius: "14px",
            padding: "55px 20px",
            textAlign: "center",
          }}
        >
          <Loader2
            size={30}
            className="spin"
            color="#2879df"
          />

          <p
            style={{
              color:
                "#7e8a9d",
              marginTop: "12px",
              fontSize: "13px",
            }}
          >
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div>
        <Header />

        <div
          style={{
            background: "#fff",
            border:
              "1px solid #e7ecf2",
            borderRadius: "14px",
            padding: "45px 25px",
            textAlign: "center",
          }}
        >
          <AlertCircle
            size={35}
            color="#e5484d"
          />

          <h3
            style={{
              margin:
                "15px 0 8px",
            }}
          >
            Unable to load analytics
          </h3>

          <p
            style={{
              color:
                "#7e8a9d",
              fontSize: "12px",
              marginBottom:
                "18px",
            }}
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadAnalytics(true)
            }
            style={{
              border: "none",
              background:
                "#2879df",
              color: "#fff",
              padding:
                "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN
  // ============================================================

  return (
    <div>
      <Header />

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "18px",
          marginBottom: "20px",
        }}
      >
        {stats.map(
          ({
            title,
            value,
            icon: Icon,
            color,
            background,
          }) => (
            <div
              key={title}
              style={{
                background: "#fff",
                border:
                  "1px solid #e7ecf2",
                borderRadius: "14px",
                padding: "20px",
                boxShadow:
                  "0 4px 15px rgba(31,52,77,.025)",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius:
                    "11px",
                  background,
                  color,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <Icon size={21} />
              </div>

              <p
                style={{
                  color:
                    "#7e8a9d",
                  fontSize: "12px",
                  margin:
                    "14px 0 5px",
                }}
              >
                {title}
              </p>

              <h2
                style={{
                  margin: 0,
                  color:
                    "#17243c",
                  fontSize: "27px",
                }}
              >
                {value}
              </h2>
            </div>
          )
        )}
      </div>

      {/* ======================================================
          SYSTEM STATUS
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          border:
            "1px solid #e7ecf2",
          borderRadius: "14px",
          padding:
            "18px 22px",
          marginBottom: "20px",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap: "15px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius:
                "10px",
              background:
                systemHealthy
                  ? "#e8f8f1"
                  : "#fff1f2",
              color:
                systemHealthy
                  ? "#20a77d"
                  : "#dc3545",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            {systemHealthy ? (
              <CheckCircle2
                size={20}
              />
            ) : (
              <AlertCircle
                size={20}
              />
            )}
          </div>

          <div>
            <strong>
              System Status
            </strong>

            <p
              style={{
                margin:
                  "4px 0 0",
                color:
                  "#7e8a9d",
                fontSize:
                  "11px",
              }}
            >
              {errorAgents > 0
                ? `${errorAgents} agent(s) require attention.`
                : "No agents are currently reporting errors."}
            </p>
          </div>
        </div>

        <strong
          style={{
            color:
              systemHealthy
                ? "#20a77d"
                : "#dc3545",
            fontSize: "12px",
          }}
        >
          {systemHealthy
            ? "Healthy"
            : "Attention Required"}
        </strong>
      </div>

      {/* ======================================================
          AGENT PERFORMANCE
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          border:
            "1px solid #e7ecf2",
          borderRadius: "14px",
          padding: "22px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            marginBottom:
              "5px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              margin: 0,
              color:
                "#1d2940",
            }}
          >
            Agent Performance
          </h2>

          <span
            style={{
              fontSize: "10px",
              color:
                "#8994a6",
            }}
          >
            Auto-refresh: 10s
          </span>
        </div>

        <p
          style={{
            color:
              "#8994a6",
            fontSize: "11px",
            marginBottom:
              "24px",
          }}
        >
          Current performance of your
          OmniBrain agents.
        </p>

        {sortedAgents.length ===
        0 ? (
          <div
            style={{
              padding:
                "40px 20px",
              textAlign:
                "center",
              color:
                "#8994a6",
              fontSize:
                "12px",
            }}
          >
            <Bot
              size={30}
              style={{
                opacity: 0.5,
                marginBottom:
                  "8px",
              }}
            />

            <div>
              No agents available
              for analytics.
            </div>
          </div>
        ) : (
          sortedAgents.map(
            (agent, index) => {
              const tasks =
                getTasks(agent);

              const health =
                getHealth(agent);

              const status =
                agent.status ||
                "Idle";

              const normalizedStatus =
                normalizeStatus(
                  status
                );

              const running =
                normalizedStatus ===
                  "running" ||
                normalizedStatus ===
                  "active";

              const unhealthy =
                normalizedStatus ===
                  "error" ||
                normalizedStatus ===
                  "failed" ||
                normalizedStatus ===
                  "offline" ||
                health < 70;

              const healthColor =
                health >= 80
                  ? "#20a77d"
                  : health >= 50
                  ? "#ed8b3d"
                  : "#ef5350";

              return (
                <div
                  key={
                    agent.id ||
                    agent.name ||
                    index
                  }
                  style={{
                    marginBottom:
                      index ===
                      sortedAgents.length -
                        1
                        ? 0
                        : "24px",
                  }}
                >
                  {/* TOP */}

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: "15px",
                      marginBottom:
                        "9px",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "10px",
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width:
                            "36px",
                          height:
                            "36px",
                          borderRadius:
                            "9px",
                          background:
                            "#edf6ff",
                          color:
                            "#2879df",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          flexShrink: 0,
                        }}
                      >
                        <BarChart3
                          size={17}
                        />
                      </div>

                      <div
                        style={{
                          minWidth:
                            0,
                        }}
                      >
                        <strong
                          style={{
                            display:
                              "block",
                            fontSize:
                              "12px",
                            color:
                              "#1d2940",
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {agent.name ||
                            "Unnamed Agent"}
                        </strong>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "6px",
                            marginTop:
                              "4px",
                          }}
                        >
                          <span
                            style={{
                              width:
                                "7px",
                              height:
                                "7px",
                              borderRadius:
                                "50%",
                              background:
                                unhealthy
                                  ? "#ef5350"
                                  : running
                                  ? "#20a77d"
                                  : "#ed8b3d",
                            }}
                          />

                          <span
                            style={{
                              fontSize:
                                "10px",
                              color:
                                unhealthy
                                  ? "#ef5350"
                                  : running
                                  ? "#20a77d"
                                  : "#ed8b3d",
                            }}
                          >
                            {status}
                          </span>

                          {agent.category && (
                            <>
                              <span
                                style={{
                                  color:
                                    "#c3c9d2",
                                }}
                              >
                                â€¢
                              </span>

                              <span
                                style={{
                                  fontSize:
                                    "10px",
                                  color:
                                    "#8994a6",
                                }}
                              >
                                {
                                  agent.category
                                }
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* TASKS + HEALTH */}

                    <div
                      style={{
                        textAlign:
                          "right",
                        flexShrink: 0,
                      }}
                    >
                      <strong
                        style={{
                          display:
                            "block",
                          fontSize:
                            "12px",
                          color:
                            "#263249",
                        }}
                      >
                        {tasks.toLocaleString()}{" "}
                        {tasks === 1
                          ? "task"
                          : "tasks"}
                      </strong>

                      <span
                        style={{
                          fontSize:
                            "10px",
                          color:
                            healthColor,
                          fontWeight:
                            700,
                        }}
                      >
                        {health}% health
                      </span>
                    </div>
                  </div>

                  {/* HEALTH BAR */}

                  <div
                    style={{
                      height:
                        "9px",
                      background:
                        "#edf1f5",
                      borderRadius:
                        "10px",
                      overflow:
                        "hidden",
                    }}
                  >
                    <div
                      style={{
                        width:
                          `${health}%`,
                        height:
                          "100%",
                        background:
                          healthColor,
                        borderRadius:
                          "10px",
                        transition:
                          "width 0.4s ease",
                      }}
                    />
                  </div>

                  {/* LAST ACTIVITY */}

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "5px",
                      marginTop:
                        "7px",
                      color:
                        "#8994a6",
                      fontSize:
                        "9px",
                    }}
                  >
                    <Clock3
                      size={11}
                    />

                    <span>
                      {agent.last_activity ||
                        agent.lastActivity ||
                        "No recent activity"}
                    </span>
                  </div>
                </div>
              );
            }
          )
        )}
      </div>

      {/* ======================================================
          TASK DISTRIBUTION
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          border:
            "1px solid #e7ecf2",
          borderRadius: "14px",
          padding: "22px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "9px",
            marginBottom:
              "5px",
          }}
        >
          <BarChart3
            size={19}
            color="#2879df"
          />

          <h2
            style={{
              fontSize: "16px",
              margin: 0,
            }}
          >
            Task Distribution
          </h2>
        </div>

        <p
          style={{
            color:
              "#8994a6",
            fontSize: "11px",
            margin:
              "0 0 22px",
          }}
        >
          Tasks processed by each
          AI agent.
        </p>

        {agents.length === 0 ? (
          <div
            style={{
              textAlign:
                "center",
              padding:
                "30px",
              color:
                "#8994a6",
              fontSize:
                "12px",
            }}
          >
            No task data available.
          </div>
        ) : (
          <div
            style={{
              display:
                "flex",
              alignItems:
                "flex-end",
              gap: "18px",
              minHeight:
                "190px",
              overflowX:
                "auto",
              padding:
                "15px 5px 0",
            }}
          >
            {agents
              .slice(0, 10)
              .map(
                (agent, index) => {
                  const tasks =
                    getTasks(agent);

                  const height =
                    Math.max(
                      8,
                      Math.round(
                        (tasks /
                          maxTasks) *
                          130
                      )
                    );

                  return (
                    <div
                      key={
                        agent.id ||
                        agent.name ||
                        index
                      }
                      style={{
                        minWidth:
                          "55px",
                        flex: 1,
                        maxWidth:
                          "100px",
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        alignItems:
                          "center",
                        justifyContent:
                          "flex-end",
                        height:
                          "165px",
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            "10px",
                          color:
                            "#68758a",
                          marginBottom:
                            "5px",
                          fontWeight:
                            700,
                        }}
                      >
                        {tasks}
                      </span>

                      <div
                        title={`${agent.name || "Agent"}: ${tasks} tasks`}
                        style={{
                          width:
                            "34px",
                          height:
                            `${height}px`,
                          background:
                            "#2879df",
                          borderRadius:
                            "6px 6px 2px 2px",
                          minHeight:
                            "8px",
                          transition:
                            "height 0.4s ease",
                        }}
                      />

                      <span
                        style={{
                          fontSize:
                            "9px",
                          color:
                            "#8994a6",
                          marginTop:
                            "8px",
                          maxWidth:
                            "70px",
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                          textAlign:
                            "center",
                        }}
                        title={
                          agent.name ||
                          "Agent"
                        }
                      >
                        {agent.name ||
                          "Agent"}
                      </span>
                    </div>
                  );
                }
              )}
          </div>
        )}
      </div>

      {/* ======================================================
          AGENT CATEGORIES
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          border:
            "1px solid #e7ecf2",
          borderRadius: "14px",
          padding: "22px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "9px",
            marginBottom:
              "5px",
          }}
        >
          <Bot
            size={19}
            color="#8250d6"
          />

          <h2
            style={{
              fontSize: "16px",
              margin: 0,
            }}
          >
            Agent Categories
          </h2>
        </div>

        <p
          style={{
            color:
              "#8994a6",
            fontSize: "11px",
            marginBottom:
              "20px",
          }}
        >
          Distribution of agents by
          category.
        </p>

        {Object.keys(
          categories
        ).length === 0 ? (
          <div
            style={{
              textAlign:
                "center",
              padding:
                "30px",
              color:
                "#8994a6",
              fontSize:
                "12px",
            }}
          >
            No categories available.
          </div>
        ) : (
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "14px",
            }}
          >
            {Object.entries(
              categories
            ).map(
              ([
                category,
                count,
              ]) => (
                <div
                  key={
                    category
                  }
                  style={{
                    border:
                      "1px solid #edf1f5",
                    borderRadius:
                      "10px",
                    padding:
                      "15px",
                    background:
                      "#fbfcfe",
                  }}
                >
                  <div
                    style={{
                      width:
                        "35px",
                      height:
                        "35px",
                      borderRadius:
                        "9px",
                      background:
                        "#f3edff",
                      color:
                        "#8250d6",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      marginBottom:
                        "10px",
                    }}
                  >
                    <Bot
                      size={17}
                    />
                  </div>

                  <p
                    style={{
                      margin: 0,
                      color:
                        "#8994a6",
                      fontSize:
                        "11px",
                    }}
                  >
                    {category}
                  </p>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "3px",
                      fontSize:
                        "22px",
                      color:
                        "#263249",
                    }}
                  >
                    {count}
                  </strong>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ======================================================
          ANALYTICS FOOTER
      ====================================================== */}

      <div
        style={{
          background:
            "#f8fbff",
          border:
            "1px solid #dcecff",
          borderRadius:
            "14px",
          padding:
            "17px 20px",
          display:
            "flex",
          alignItems:
            "center",
          gap: "12px",
        }}
      >
        <ShieldCheck
          size={20}
          color="#2879df"
        />

        <div>
          <strong
            style={{
              display:
                "block",
              fontSize:
                "12px",
              color:
                "#263249",
            }}
          >
            Analytics monitoring active
          </strong>

          <span
            style={{
              display:
                "block",
              marginTop:
                "4px",
              color:
                "#7e8a9d",
              fontSize:
                "10px",
            }}
          >
            OmniBrain refreshes agent
            analytics automatically every
            10 seconds.
          </span>
        </div>
      </div>

      {/* ======================================================
          RESPONSIVE
      ====================================================== */}

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          @media (max-width: 900px) {
            .analytics-stat-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 600px) {
            .analytics-stat-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}

export default Analytics;

