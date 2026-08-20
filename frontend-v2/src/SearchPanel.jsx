import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Bot,
  BarChart3,
  Activity,
  Database,
  ShieldCheck,
  Bell,
  LayoutDashboard,
  Settings,
  X,
  Loader2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function SearchPanel({
  onClose,
  onNavigate,
}) {
  const [query, setQuery] = useState("");

  const [agents, setAgents] = useState([]);

  const [documents, setDocuments] =
    useState([]);

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ============================================================
  // LOAD SEARCH DATA
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadSearchData = async () => {
      try {
        setLoading(true);
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

        const headers = {
          Authorization:
            `Bearer ${token}`,
        };

        // ------------------------------------------------------
        // DASHBOARD
        // ------------------------------------------------------

        const dashboardResponse =
          await fetch(
            `${API_URL}/dashboard/`,
            {
              method: "GET",
              headers,
            }
          );

        if (
          dashboardResponse.status ===
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

        let dashboardData = {};

        try {
          dashboardData =
            await dashboardResponse.json();
        } catch {
          dashboardData = {};
        }

        // ------------------------------------------------------
        // AGENTS
        // ------------------------------------------------------

        const agentsResponse =
          await fetch(
            `${API_URL}/agents/`,
            {
              method: "GET",
              headers,
            }
          );

        let agentsData = [];

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
          try {
            const data =
              await agentsResponse.json();

            agentsData =
              Array.isArray(data)
                ? data
                : [];
          } catch {
            agentsData = [];
          }
        }

        // ------------------------------------------------------
        // KNOWLEDGE
        // ------------------------------------------------------

        const knowledgeResponse =
          await fetch(
            `${API_URL}/knowledge/`,
            {
              method: "GET",
              headers,
            }
          );

        let knowledgeData = {};

        if (
          knowledgeResponse.status ===
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

        if (knowledgeResponse.ok) {
          try {
            knowledgeData =
              await knowledgeResponse.json();
          } catch {
            knowledgeData = {};
          }
        }

        const rawDocuments =
          Array.isArray(
            knowledgeData
          )
            ? knowledgeData
            : Array.isArray(
                knowledgeData?.documents
              )
            ? knowledgeData.documents
            : Array.isArray(
                knowledgeData?.items
              )
            ? knowledgeData.items
            : [];

        if (!cancelled) {
          setDashboard(
            dashboardData || {}
          );

          setAgents(
            agentsData
          );

          setDocuments(
            rawDocuments
          );
        }
      } catch (err) {
        console.error(
          "Global search loading error:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load search data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSearchData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // DASHBOARD DATA
  // ============================================================

  const statistics =
    dashboard?.statistics || {};

  const services =
    dashboard?.services || {};

  const alertCount =
    Number(
      dashboard?.alerts_count ??
        statistics?.alerts_count ??
        0
    );

  // ============================================================
  // BUILD GLOBAL SEARCH INDEX
  // ============================================================

  const searchItems = useMemo(() => {
    const items = [];

    // ----------------------------------------------------------
    // OVERVIEW
    // ----------------------------------------------------------

    items.push({
      id: "overview",
      title:
        "Intelligence Command Center",
      description:
        "OmniBrain overview and system summary",
      category: "Overview",
      icon: LayoutDashboard,
      menu: "Overview",
      keywords: [
        "overview",
        "dashboard",
        "command center",
        "workspace",
        "system",
      ],
    });

    // ----------------------------------------------------------
    // AI AGENTS + MONITORING + ANALYTICS
    // ----------------------------------------------------------

    agents.forEach(
      (agent, index) => {
        const name =
          agent?.name ||
          `Agent ${index + 1}`;

        const description =
          agent?.description ||
          "AI agent";

        const category =
          agent?.category ||
          "AI Agent";

        const status =
          agent?.status ||
          "Idle";

        const tasks =
          Number(
            agent?.tasks ??
              agent?.total_tasks ??
              0
          );

        const health =
          Number(
            agent?.health ??
              agent?.health_score ??
              100
          );

        items.push({
          id:
            `agent-${agent?.id || index}`,
          title: name,
          description,
          category:
            `AI Agent â€¢ ${status}`,
          icon: Bot,
          menu: "AI Agents",
          keywords: [
            name,
            description,
            category,
            status,
            "agent",
            "ai",
            "monitoring",
            "analytics",
            String(tasks),
            String(health),
          ],
        });
      }
    );

    // ----------------------------------------------------------
    // KNOWLEDGE DOCUMENTS
    // ----------------------------------------------------------

    documents.forEach(
      (document, index) => {
        const name =
          document?.name ||
          document?.filename ||
          document?.file_name ||
          `Document ${index + 1}`;

        const type =
          document?.type ||
          document?.file_type ||
          "";

        const status =
          document?.status ||
          "Indexed";

        const chunks =
          document?.chunks ??
          document?.chunk_count ??
          document?.indexed_chunks ??
          0;

        items.push({
          id:
            `knowledge-${document?.id || index}`,
          title: name,
          description:
            `${type || "Document"} â€¢ ${chunks} chunks â€¢ ${status}`,
          category:
            "Knowledge",
          icon: Database,
          menu: "Knowledge",
          keywords: [
            name,
            type,
            status,
            "knowledge",
            "document",
            "file",
            "chunks",
            String(chunks),
          ],
        });
      }
    );

    // ----------------------------------------------------------
    // ANALYTICS SUMMARY
    // ----------------------------------------------------------

    items.push({
      id: "analytics-summary",
      title:
        "Analytics Overview",
      description:
        `${statistics.total_tasks ?? 0} tasks processed`,
      category: "Analytics",
      icon: BarChart3,
      menu: "Analytics",
      keywords: [
        "analytics",
        "tasks",
        "processed",
        "statistics",
        "performance",
        String(
          statistics.total_tasks ?? 0
        ),
      ],
    });

    // ----------------------------------------------------------
    // MONITORING SUMMARY
    // ----------------------------------------------------------

    items.push({
      id: "monitoring-summary",
      title:
        "System Monitoring",
      description:
        `${agents.length} agents â€¢ ${statistics.active_agents ?? 0} active`,
      category: "Monitoring",
      icon: Activity,
      menu: "Monitoring",
      keywords: [
        "monitoring",
        "monitor",
        "running",
        "active",
        "idle",
        "health",
        "status",
        "agent",
      ],
    });

    // ----------------------------------------------------------
    // SYSTEM HEALTH
    // ----------------------------------------------------------

    Object.entries(
      services || {}
    ).forEach(
      ([key, value]) => {
        const serviceName =
          key
            .replace(
              /_/g,
              " "
            )
            .replace(
              /\b\w/g,
              (char) =>
                char.toUpperCase()
            );

        items.push({
          id:
            `service-${key}`,
          title:
            serviceName,
          description:
            typeof value ===
            "boolean"
              ? value
                ? "Online"
                : "Offline"
              : String(
                  value ||
                    "Available"
                ),
          category:
            "System Health",
          icon:
            ShieldCheck,
          menu:
            "Monitoring",
          keywords: [
            key,
            serviceName,
            String(value),
            "system",
            "health",
            "service",
            "backend",
            "database",
            "security",
          ],
        });
      }
    );

    // ----------------------------------------------------------
    // ALERTS
    // ----------------------------------------------------------

    items.push({
      id: "alerts",
      title:
        "System Alerts",
      description:
        alertCount > 0
          ? `${alertCount} active alert${
              alertCount !== 1
                ? "s"
                : ""
            }`
          : "No active alerts",
      category: "Alerts",
      icon: Bell,
      menu: "Alerts",
      keywords: [
        "alerts",
        "alert",
        "notification",
        "warning",
        "error",
        "system",
        String(alertCount),
      ],
    });

    // ----------------------------------------------------------
    // SETTINGS
    // ----------------------------------------------------------

    items.push({
      id: "settings",
      title:
        "System Settings",
      description:
        "Configure OmniBrain workspace preferences",
      category: "Settings",
      icon: Settings,
      menu: "Settings",
      keywords: [
        "settings",
        "preferences",
        "notifications",
        "refresh",
        "automatic refresh",
        "configuration",
      ],
    });

    return items;
  }, [
    agents,
    documents,
    dashboard,
    statistics,
    services,
    alertCount,
  ]);

  // ============================================================
  // FILTER RESULTS
  // ============================================================

  const results = useMemo(() => {
    const value =
      query
        .trim()
        .toLowerCase();

    if (!value) {
      return searchItems.slice(
        0,
        8
      );
    }

    return searchItems
      .filter((item) => {
        const searchable =
          [
            item.title,
            item.description,
            item.category,
            ...(item.keywords || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchable.includes(
          value
        );
      })
      .slice(0, 12);
  }, [
    query,
    searchItems,
  ]);

  // ============================================================
  // NAVIGATE
  // ============================================================

  const handleResultClick = (
    item
  ) => {
    if (
      typeof onNavigate ===
      "function"
    ) {
      onNavigate(item.menu);
    }

    onClose();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(15,23,42,.25)",
        zIndex: 100,
        display: "flex",
        justifyContent:
          "center",
        alignItems:
          "flex-start",
        paddingTop: "80px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "620px",
          maxWidth: "92%",
          maxHeight:
            "calc(100vh - 120px)",
          background: "#fff",
          borderRadius: "14px",
          boxShadow:
            "0 20px 60px rgba(15,23,42,.18)",
          overflow: "hidden",
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* SEARCH INPUT */}

        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "10px",
            borderBottom:
              "1px solid #edf0f4",
            padding:
              "0 15px",
          }}
        >
          <Search
            size={19}
            color="#8994a6"
          />

          <input
            autoFocus
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                "Escape"
              ) {
                onClose();
              }
            }}
            placeholder="Search agents, analytics, knowledge, monitoring..."
            style={{
              flex: 1,
              height: "52px",
              border: 0,
              outline: 0,
              fontSize: "13px",
              color: "#263249",
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() =>
                setQuery("")
              }
              style={{
                border: 0,
                background:
                  "#f1f4f8",
                width: "27px",
                height: "27px",
                borderRadius: "6px",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                cursor:
                  "pointer",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* CONTENT */}

        <div
          style={{
            maxHeight:
              "calc(100vh - 175px)",
            overflowY:
              "auto",
            padding: "10px",
          }}
        >
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
                size={25}
                style={{
                  animation:
                    "omnibrainSearchSpin 1s linear infinite",
                }}
              />

              <div
                style={{
                  marginTop:
                    "10px",
                }}
              >
                Searching OmniBrain...
              </div>
            </div>
          ) : error ? (
            <div
              style={{
                padding:
                  "35px 20px",
                textAlign:
                  "center",
                color:
                  "#dc2626",
                fontSize:
                  "12px",
              }}
            >
              {error}
            </div>
          ) : results.length ===
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
              <Search
                size={30}
                style={{
                  opacity: 0.4,
                  marginBottom:
                    "10px",
                }}
              />

              <div>
                No results found
              </div>

              <small
                style={{
                  display:
                    "block",
                  marginTop:
                    "5px",
                }}
              >
                Try searching for an
                agent, document,
                task, status or
                system service.
              </small>
            </div>
          ) : (
            <>
              <div
                style={{
                  padding:
                    "6px 8px 9px",
                  color:
                    "#8994a6",
                  fontSize:
                    "10px",
                  fontWeight:
                    600,
                }}
              >
                {query
                  ? `${results.length} result${
                      results.length !==
                      1
                        ? "s"
                        : ""
                    }`
                  : "Quick Search"}
              </div>

              {results.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <button
                      type="button"
                      key={
                        item.id
                      }
                      onClick={() =>
                        handleResultClick(
                          item
                        )
                      }
                      style={{
                        width:
                          "100%",
                        border: 0,
                        background:
                          "transparent",
                        padding:
                          "12px 10px",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap:
                          "12px",
                        textAlign:
                          "left",
                        cursor:
                          "pointer",
                        borderRadius:
                          "9px",
                      }}
                      onMouseEnter={(
                        event
                      ) => {
                        event.currentTarget.style.background =
                          "#f7f9fc";
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
                          width:
                            "38px",
                          height:
                            "38px",
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
                          flexShrink:
                            0,
                        }}
                      >
                        <Icon
                          size={18}
                        />
                      </div>

                      <div
                        style={{
                          minWidth:
                            0,
                          flex: 1,
                        }}
                      >
                        <strong
                          style={{
                            display:
                              "block",
                            color:
                              "#263249",
                            fontSize:
                              "12px",
                          }}
                        >
                          {item.title}
                        </strong>

                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#8994a6",
                            fontSize:
                              "10px",
                            marginTop:
                              "3px",
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            item.description
                          }
                        </span>
                      </div>

                      <span
                        style={{
                          color:
                            "#8994a6",
                          fontSize:
                            "9px",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {
                          item.category
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes omnibrainSearchSpin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

export default SearchPanel;

