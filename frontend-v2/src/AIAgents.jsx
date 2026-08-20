import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Database,
  Gauge,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  Loader2,
} from "lucide-react";

import "./AIAgents.css";


/* ============================================================
   API
   ============================================================ */

const API_URL = "http://127.0.0.1:8000";


/* ============================================================
   ICON MAP
   ============================================================ */

const ICON_MAP = {
  BarChart3,
  Activity,
  Database,
  ShieldCheck,
  UserRound,
  BrainCircuit,
  Bot,
};


/* ============================================================
   APPEARANCE
   ============================================================ */

const getAppearance = (category) => {

  const appearance = {

    Analytics: {
      iconName: "BarChart3",
      color: "blue",
    },

    Monitoring: {
      iconName: "Activity",
      color: "green",
    },

    Knowledge: {
      iconName: "Database",
      color: "purple",
    },

    Security: {
      iconName: "ShieldCheck",
      color: "orange",
    },

    Support: {
      iconName: "UserRound",
      color: "cyan",
    },

    "AI / RAG": {
      iconName: "BrainCircuit",
      color: "indigo",
    },

  };

  return (
    appearance[category] || {
      iconName: "Bot",
      color: "blue",
    }
  );
};


/* ============================================================
   CLEAN SOURCE NAME
   ============================================================ */

const cleanSourceName = (source = "") => {

  if (!source) {
    return "Unknown source";
  }

  const value = String(source);

  /*
    Backend internally stores files like:

    184b2e7895ae41c78523c078d6d48bf4_Industrial Safety Guidelines.txt

    Remove the UUID prefix for the UI.
  */

  const cleaned = value.replace(
    /^[a-f0-9]{20,}_/i,
    ""
  );

  return cleaned || value;
};


/* ============================================================
   NORMALIZE AGENT
   ============================================================ */

const normalizeAgent = (agent = {}) => {

  const category =
    agent.category || "Analytics";

  const appearance =
    getAppearance(category);

  return {

    id: agent.id,

    name:
      agent.name ||
      "Unnamed Agent",

    description:
      agent.description ||
      "No description available.",

    category,

    status:
      agent.status ||
      "Idle",

    health: Math.min(
      Math.max(
        Number(
          agent.health ??
          agent.health_score ??
          100
        ),
        0
      ),
      100
    ),

    tasks: Number(
      agent.tasks ??
      agent.total_tasks ??
      0
    ),

    lastActivity:
      agent.last_activity ||
      agent.lastActivity ||
      "No activity recorded",

    iconName:
      agent.icon_name ||
      agent.iconName ||
      appearance.iconName,

    color:
      agent.color ||
      appearance.color,

    aiModel:
      agent.ai_model ||
      agent.aiModel ||
      "GPT-4o",

    systemInstructions:
      agent.system_instructions ||
      agent.systemInstructions ||
      "You are an intelligent AI agent. Analyze the provided information and provide accurate, useful responses.",

    temperature: Number(
      agent.temperature ?? 0.7
    ),
  };
};


/* ============================================================
   MAIN COMPONENT
   ============================================================ */

function AIAgents() {


  /* ============================================================
     AGENTS
     ============================================================ */

  const [agents, setAgents] =
    useState([]);


  /* ============================================================
     SEARCH / FILTER
     ============================================================ */

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");


  /* ============================================================
     LOADING
     ============================================================ */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [agentActionLoading, setAgentActionLoading] =
    useState(null);

  const [executingTask, setExecutingTask] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  /* ============================================================
     SELECTED AGENT
     ============================================================ */

  const [selectedAgent, setSelectedAgent] =
    useState(null);


  /* ============================================================
     AI TASK
     ============================================================ */

  const [taskText, setTaskText] =
    useState("");

  const [taskResponse, setTaskResponse] =
    useState("");

  const [taskSources, setTaskSources] =
    useState([]);


  /* ============================================================
     MODALS
     ============================================================ */

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showConfigureModal, setShowConfigureModal] =
    useState(false);


  /* ============================================================
     CREATE FORM
     ============================================================ */

  const [newAgentName, setNewAgentName] =
    useState("");

  const [newAgentDescription, setNewAgentDescription] =
    useState("");

  const [newAgentCategory, setNewAgentCategory] =
    useState("Analytics");


  /* ============================================================
     CONFIGURATION FORM
     ============================================================ */

  const [configName, setConfigName] =
    useState("");

  const [configDescription, setConfigDescription] =
    useState("");

  const [configCategory, setConfigCategory] =
    useState("Analytics");

  const [configModel, setConfigModel] =
    useState("GPT-4o");

  const [configInstructions, setConfigInstructions] =
    useState("");

  const [configTemperature, setConfigTemperature] =
    useState(0.7);


  /* ============================================================
     AUTH HELPERS
     ============================================================ */

  const getToken = () => {

    return localStorage.getItem(
      "access_token"
    );
  };


  const getHeaders = (
    includeJson = false
  ) => {

    const token =
      getToken();

    return {

      ...(includeJson
        ? {
            "Content-Type":
              "application/json",
          }
        : {}),

      ...(token
        ? {
            Authorization:
              `Bearer ${token}`,
          }
        : {}),

    };
  };


  const handleUnauthorized = () => {

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user_email"
    );

    window.location.href = "/";
  };


  /* ============================================================
     LOAD AGENTS
     ============================================================ */

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
          getToken();

        if (!token) {

          setError(
            "Authentication required. Please sign in again."
          );

          return;
        }


        const response =
          await fetch(
            `${API_URL}/agents/`,
            {
              method: "GET",
              headers:
                getHeaders(),
            }
          );


        if (
          response.status === 401
        ) {

          handleUnauthorized();

          return;
        }


        const data =
          await response
            .json()
            .catch(() => []);


        if (!response.ok) {

          throw new Error(
            data?.detail ||
            `Failed to load agents (${response.status})`
          );

        }


        const normalized =
          Array.isArray(data)
            ? data.map(
                normalizeAgent
              )
            : [];


        setAgents(
          normalized
        );

      } catch (err) {

        console.error(
          "Load agents error:",
          err
        );

        setError(
          err?.message ||
          "Unable to connect to the AI Agent backend."
        );

      } finally {

        setLoading(false);

        setRefreshing(false);

      }

    },
    []
  );


  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {

    loadAgents();

  }, [loadAgents]);


  /* ============================================================
     AUTO REFRESH
     ============================================================ */

  useEffect(() => {

    const interval =
      setInterval(() => {

        loadAgents(false);

      }, 10000);


    return () =>
      clearInterval(interval);

  }, [loadAgents]);


  /* ============================================================
     CLEAR SUCCESS MESSAGE
     ============================================================ */

  useEffect(() => {

    if (!successMessage) {
      return;
    }


    const timer =
      setTimeout(() => {

        setSuccessMessage("");

      }, 3500);


    return () =>
      clearTimeout(timer);

  }, [successMessage]);


  /* ============================================================
     START / STOP AGENT
     ============================================================ */

  const toggleAgentStatus =
    async (agent) => {

      if (
        !agent ||
        agentActionLoading ===
          agent.id
      ) {
        return;
      }


      const isRunning =
        agent.status ===
          "Running" ||
        agent.status ===
          "Active";


      const action =
        isRunning
          ? "stop"
          : "start";


      try {

        setAgentActionLoading(
          agent.id
        );

        setError("");
        setSuccessMessage("");


        const response =
          await fetch(
            `${API_URL}/agents/${agent.id}/${action}`,
            {
              method: "POST",
              headers:
                getHeaders(),
            }
          );


        if (
          response.status === 401
        ) {

          handleUnauthorized();

          return;
        }


        const data =
          await response
            .json()
            .catch(() => null);


        if (!response.ok) {

          throw new Error(
            data?.detail ||
            `Unable to ${action} agent (${response.status})`
          );

        }


        const backendAgent =
          data?.agent ||
          data;


        const updatedAgent =
          normalizeAgent(
            backendAgent
          );


        setAgents(
          (current) =>
            current.map(
              (item) =>
                String(item.id) ===
                String(
                  updatedAgent.id
                )
                  ? updatedAgent
                  : item
            )
        );


        setSelectedAgent(
          (current) =>
            current &&
            String(
              current.id
            ) ===
              String(
                updatedAgent.id
              )
              ? updatedAgent
              : current
        );


        setSuccessMessage(
          `${updatedAgent.name} ${
            action === "start"
              ? "started"
              : "stopped"
          } successfully.`
        );


        await loadAgents(false);

      } catch (err) {

        console.error(
          `${action} agent error:`,
          err
        );

        setError(
          err?.message ||
          `Unable to ${action} agent.`
        );

      } finally {

        setAgentActionLoading(
          null
        );

      }

    };


  /* ============================================================
     EXECUTE AI TASK
     ============================================================ */

  const executeTask =
    async () => {

      if (!selectedAgent) {
        return;
      }


      const task =
        taskText.trim();


      if (!task) {

        setError(
          "Please enter a task for the agent."
        );

        return;
      }


      if (
        selectedAgent.status !==
          "Running" &&
        selectedAgent.status !==
          "Active"
      ) {

        setError(
          "Agent must be Running before executing a task."
        );

        return;
      }


      try {

        setExecutingTask(true);

        setError("");

        setSuccessMessage("");

        setTaskResponse("");

        setTaskSources([]);


        const response =
          await fetch(
            `${API_URL}/agents/${selectedAgent.id}/execute`,
            {
              method: "POST",

              headers:
                getHeaders(true),

              body:
                JSON.stringify({
                  task,
                }),
            }
          );


        if (
          response.status === 401
        ) {

          handleUnauthorized();

          return;
        }


        const data =
          await response
            .json()
            .catch(() => null);


        if (!response.ok) {

          throw new Error(
            data?.detail ||
            `Task execution failed (${response.status})`
          );

        }


        const result =
          data?.result ||
          data?.response ||
          "";


        const sources =
          Array.isArray(
            data?.sources
          )
            ? data.sources
            : [];


        setTaskResponse(
          result
        );


        setTaskSources(
          sources
            .map(
              cleanSourceName
            )
            .filter(Boolean)
        );


        setSuccessMessage(
          "AI task completed successfully."
        );


        /*
          Refresh agent statistics so
          Tasks Processed updates immediately.
        */

        await loadAgents(false);


        /*
          Update selected agent from
          refreshed backend data.
        */

        setAgents(
          (current) =>
            current.map(
              (agent) => {

                if (
                  String(agent.id) !==
                  String(
                    selectedAgent.id
                  )
                ) {
                  return agent;
                }

                return {
                  ...agent,

                  tasks:
                    Number(
                      agent.tasks || 0
                    ) + 1,

                  lastActivity:
                    new Date().toISOString(),
                };

              }
            )
        );


      } catch (err) {

        console.error(
          "Execute AI task error:",
          err
        );

        setError(
          err?.message ||
          "Unable to execute AI task."
        );

      } finally {

        setExecutingTask(false);

      }

    };


  /* ============================================================
     FILTERED AGENTS
     ============================================================ */

  const filteredAgents =
    useMemo(() => {

      const text =
        search
          .trim()
          .toLowerCase();


      return agents.filter(
        (agent) => {

          const matchesSearch =
            !text ||
            String(
              agent.name
            )
              .toLowerCase()
              .includes(text) ||
            String(
              agent.description
            )
              .toLowerCase()
              .includes(text) ||
            String(
              agent.category
            )
              .toLowerCase()
              .includes(text);


          const matchesFilter =
            filter === "All" ||
            agent.status ===
              filter;


          return (
            matchesSearch &&
            matchesFilter
          );

        }
      );

    }, [
      agents,
      search,
      filter,
    ]);


  /* ============================================================
     STATISTICS
     ============================================================ */

  const totalAgents =
    agents.length;


  const activeAgents =
    agents.filter(
      (agent) =>
        agent.status ===
          "Active" ||
        agent.status ===
          "Running"
    ).length;


  const idleAgents =
    agents.filter(
      (agent) =>
        agent.status ===
        "Idle"
    ).length;


  const averageHealth =
    totalAgents > 0
      ? Math.round(
          agents.reduce(
            (sum, agent) =>
              sum +
              Number(
                agent.health ||
                  0
              ),
            0
          ) /
            totalAgents
        )
      : 0;


  /* ============================================================
     CREATE AGENT
     ============================================================ */

  const createAgent =
    async () => {

      const name =
        newAgentName.trim();

      const description =
        newAgentDescription.trim();


      if (!name) {

        setError(
          "Please enter an agent name."
        );

        return;
      }


      if (!description) {

        setError(
          "Please enter an agent description."
        );

        return;
      }


      try {

        setSaving(true);

        setError("");

        setSuccessMessage("");


        const appearance =
          getAppearance(
            newAgentCategory
          );


        const payload = {

          name,

          description,

          category:
            newAgentCategory,

          status:
            "Idle",

          health: 100,

          tasks: 0,

          icon_name:
            appearance.iconName,

          color:
            appearance.color,

          ai_model:
            "GPT-4o",

          system_instructions:
            "You are an intelligent AI agent. Analyze the provided information and provide accurate, useful responses.",

          temperature:
            0.7,

        };


        const response =
          await fetch(
            `${API_URL}/agents/`,
            {
              method: "POST",

              headers:
                getHeaders(true),

              body:
                JSON.stringify(
                  payload
                ),
            }
          );


        if (
          response.status === 401
        ) {

          handleUnauthorized();

          return;
        }


        const data =
          await response
            .json()
            .catch(() => null);


        if (!response.ok) {

          throw new Error(
            data?.detail ||
            `Failed to create agent (${response.status})`
          );

        }


        const createdAgent =
          data?.agent ||
          data;


        const normalized =
          normalizeAgent(
            createdAgent
          );


        setAgents(
          (current) => [
            ...current,
            normalized,
          ]
        );


        setNewAgentName("");

        setNewAgentDescription("");

        setNewAgentCategory(
          "Analytics"
        );


        setShowCreateModal(
          false
        );


        setSearch("");

        setFilter("All");


        setSuccessMessage(
          "Agent created successfully."
        );


        await loadAgents(false);

      } catch (err) {

        console.error(
          "Create agent error:",
          err
        );

        setError(
          err?.message ||
          "Unable to create agent."
        );

      } finally {

        setSaving(false);

      }

    };


  /* ============================================================
     OPEN CONFIGURATION
     ============================================================ */

  const openConfiguration =
    (agent) => {

      setSelectedAgent(
        agent
      );


      setConfigName(
        agent.name
      );

      setConfigDescription(
        agent.description
      );

      setConfigCategory(
        agent.category
      );

      setConfigModel(
        agent.aiModel ||
          "GPT-4o"
      );

      setConfigInstructions(
        agent.systemInstructions ||
          ""
      );

      setConfigTemperature(
        agent.temperature ??
          0.7
      );


      setShowConfigureModal(
        true
      );

    };


  /* ============================================================
     OPEN AGENT DETAILS
     ============================================================ */

  const openAgentDetails =
    (agent) => {

      setSelectedAgent(
        agent
      );

      /*
        Clear the previous agent's
        AI task response.
      */

      setTaskText("");

      setTaskResponse("");

      setTaskSources([]);

      setError("");

    };


  /* ============================================================
     SAVE CONFIGURATION
     ============================================================ */

  const saveConfiguration =
    async () => {

      if (!selectedAgent) {
        return;
      }


      if (
        !configName.trim()
      ) {

        setError(
          "Agent name is required."
        );

        return;
      }


      if (
        !configDescription.trim()
      ) {

        setError(
          "Agent description is required."
        );

        return;
      }


      try {

        setSaving(true);

        setError("");

        setSuccessMessage("");


        const appearance =
          getAppearance(
            configCategory
          );


        const payload = {

          name:
            configName.trim(),

          description:
            configDescription.trim(),

          category:
            configCategory,

          icon_name:
            appearance.iconName,

          color:
            appearance.color,

          ai_model:
            configModel,

          system_instructions:
            configInstructions.trim(),

          temperature:
            Number(
              configTemperature
            ),

        };


        const response =
          await fetch(
            `${API_URL}/agents/${selectedAgent.id}`,
            {
              method: "PUT",

              headers:
                getHeaders(true),

              body:
                JSON.stringify(
                  payload
                ),
            }
          );


        if (
          response.status === 401
        ) {

          handleUnauthorized();

          return;
        }


        const data =
          await response
            .json()
            .catch(() => null);


        if (!response.ok) {

          throw new Error(
            data?.detail ||
            `Failed to update agent (${response.status})`
          );

        }


        const backendAgent =
          data?.agent ||
          data;


        const normalized =
          normalizeAgent(
            backendAgent
          );


        setAgents(
          (current) =>
            current.map(
              (agent) =>
                String(
                  agent.id
                ) ===
                String(
                  normalized.id
                )
                  ? normalized
                  : agent
            )
        );


        setSelectedAgent(
          normalized
        );


        setShowConfigureModal(
          false
        );


        setSuccessMessage(
          "Agent configuration saved successfully."
        );


        await loadAgents(false);

      } catch (err) {

        console.error(
          "Save configuration error:",
          err
        );

        setError(
          err?.message ||
          "Unable to save configuration."
        );

      } finally {

        setSaving(false);

      }

    };


  /* ============================================================
     DELETE AGENT
     ============================================================ */

  const deleteAgent =
    async () => {

      if (!selectedAgent) {
        return;
      }


      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${selectedAgent.name}?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setSaving(true);

        setError("");

        setSuccessMessage("");


        const response =
          await fetch(
            `${API_URL}/agents/${selectedAgent.id}`,
            {
              method: "DELETE",

              headers:
                getHeaders(),
            }
          );


        if (
          response.status === 401
        ) {

          handleUnauthorized();

          return;
        }


        const data =
          await response
            .json()
            .catch(() => null);


        if (!response.ok) {

          throw new Error(
            data?.detail ||
            `Failed to delete agent (${response.status})`
          );

        }


        setAgents(
          (current) =>
            current.filter(
              (agent) =>
                String(
                  agent.id
                ) !==
                String(
                  selectedAgent.id
                )
            )
        );


        const deletedName =
          selectedAgent.name;


        setSelectedAgent(
          null
        );

        setShowConfigureModal(
          false
        );


        setTaskText("");

        setTaskResponse("");

        setTaskSources([]);


        setSuccessMessage(
          `${deletedName} deleted successfully.`
        );


        await loadAgents(false);

      } catch (err) {

        console.error(
          "Delete agent error:",
          err
        );

        setError(
          err?.message ||
          "Unable to delete agent."
        );

      } finally {

        setSaving(false);

      }

    };


  /* ============================================================
     CLOSE CREATE MODAL
     ============================================================ */

  const closeCreateModal =
    () => {

      if (saving) {
        return;
      }


      setShowCreateModal(
        false
      );

      setNewAgentName("");

      setNewAgentDescription("");

      setNewAgentCategory(
        "Analytics"
      );

    };


  /* ============================================================
     CLOSE CONFIGURATION
     ============================================================ */

  const closeConfiguration =
    () => {

      if (saving) {
        return;
      }


      setShowConfigureModal(
        false
      );

    };

  return (
    <div className="agents-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="agents-header">

        <div className="agents-header-left">

          <div className="agents-breadcrumb">

            <span>
              Workspace
            </span>

            <b>
              /
            </b>

            <strong>
              AI Agents
            </strong>

          </div>


          <div className="agents-title-row">

            <div className="agents-title-icon">

              <Bot size={27} />

            </div>


            <div>

              <h1>
                AI Agents
              </h1>

              <p>
                Manage and monitor your intelligent AI agents.
              </p>

            </div>

          </div>

        </div>


        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >

          <button
            type="button"
            onClick={() =>
              loadAgents(true)
            }
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              border:
                "1px solid #dfe5ed",
              background: "#fff",
              color: "#2879df",
              padding:
                "10px 13px",
              borderRadius:
                "9px",
              cursor:
                refreshing
                  ? "not-allowed"
                  : "pointer",
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


          <button
            type="button"
            className="create-agent-button"
            onClick={() =>
              setShowCreateModal(
                true
              )
            }
          >

            <Plus size={18} />

            Create New Agent

          </button>

        </div>

      </header>


      {/* ======================================================
          SYSTEM STATUS
          ====================================================== */}

      <div className="agents-system-status">

        <div className="system-status-left">

          <span className="online-dot"></span>

          <strong>
            AI SYSTEM ONLINE
          </strong>

          <span className="status-divider"></span>

          <span>
            {error
              ? "Backend connection requires attention"
              : "All agent services are operational"}
          </span>

        </div>


        <div className="system-status-right">

          <Sparkles size={16} />

          OmniBrain Intelligence Engine

        </div>

      </div>


      {/* ======================================================
          SUCCESS
          ====================================================== */}

      {successMessage && (

        <div
          style={{
            marginBottom:
              "16px",
            padding:
              "11px 14px",
            borderRadius:
              "9px",
            border:
              "1px solid #ccefe1",
            background:
              "#f0fbf7",
            color:
              "#16805f",
            fontSize:
              "12px",
            display:
              "flex",
            alignItems:
              "center",
            gap:
              "8px",
          }}
        >

          <CheckCircle2
            size={16}
          />

          {successMessage}

        </div>

      )}


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (

        <div
          style={{
            marginBottom:
              "20px",
            padding:
              "12px 15px",
            borderRadius:
              "10px",
            border:
              "1px solid #f0d2d2",
            background:
              "#fff7f7",
            color:
              "#b94d4d",
            fontSize:
              "12px",
          }}
        >

          {error}

          <button
            type="button"
            onClick={() =>
              loadAgents(true)
            }
            style={{
              marginLeft:
                "12px",
              border: 0,
              background:
                "transparent",
              color:
                "#2878df",
              fontWeight:
                600,
              cursor:
                "pointer",
            }}
          >
            Retry
          </button>

        </div>

      )}


      {/* ======================================================
          SUMMARY
          ====================================================== */}

      <section className="agent-summary">

        <div className="summary-card">

          <div className="summary-icon blue">

            <Bot size={21} />

          </div>


          <div className="summary-content">

            <span>
              Total Agents
            </span>

            <strong>
              {String(
                totalAgents
              ).padStart(
                2,
                "0"
              )}
            </strong>

            <small>
              PostgreSQL agents
            </small>

          </div>


          <span className="summary-trend">
            Live
          </span>

        </div>


        <div className="summary-card">

          <div className="summary-icon green">

            <CheckCircle2
              size={21}
            />

          </div>


          <div className="summary-content">

            <span>
              Active Agents
            </span>

            <strong>
              {String(
                activeAgents
              ).padStart(
                2,
                "0"
              )}
            </strong>

            <small>
              Currently operational
            </small>

          </div>


          <span className="summary-trend green-text">
            Stable
          </span>

        </div>


        <div className="summary-card">

          <div className="summary-icon purple">

            <Gauge size={21} />

          </div>


          <div className="summary-content">

            <span>
              Average Health
            </span>

            <strong>
              {averageHealth}%
            </strong>

            <small>
              Across all agents
            </small>

          </div>


          <span className="summary-trend">
            Live
          </span>

        </div>


        <div className="summary-card">

          <div className="summary-icon orange">

            <Activity size={21} />

          </div>


          <div className="summary-content">

            <span>
              Idle Agents
            </span>

            <strong>
              {String(
                idleAgents
              ).padStart(
                2,
                "0"
              )}
            </strong>

            <small>
              Awaiting tasks
            </small>

          </div>


          <span className="summary-trend orange-text">
            Normal
          </span>

        </div>

      </section>


      {/* ======================================================
          TOOLBAR
          ====================================================== */}

      <section className="agents-toolbar">

        <div className="agents-toolbar-title">

          <h2>
            Agent Workspace
          </h2>

          <span>
            {filteredAgents.length} agents
          </span>

        </div>


        <div className="agents-controls">

          <div className="agent-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />


            {search && (

              <button
                type="button"
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
              >

                <X size={14} />

              </button>

            )}

          </div>


          <div className="agent-filters">

            {[
              "All",
              "Running",
              "Active",
              "Idle",
            ].map(
              (item) => (

                <button
                  key={item}
                  type="button"
                  className={
                    filter === item
                      ? "filter-active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      item
                    )
                  }
                >

                  {item}

                </button>

              )
            )}

          </div>

        </div>

      </section>


      {/* ======================================================
          LOADING
          ====================================================== */}

      {loading && (

        <div className="agents-empty">

          <div>

            <Loader2
              size={28}
              className="spin"
            />

          </div>


          <h3>
            Loading AI agents...
          </h3>


          <p>
            Fetching agents from PostgreSQL.
          </p>

        </div>

      )}


      {/* ======================================================
          AGENT GRID
          ====================================================== */}

      {!loading &&
        filteredAgents.length > 0 && (

          <section className="agent-grid">

            {filteredAgents.map(
              (agent) => {

                const AgentIcon =
                  ICON_MAP[
                    agent.iconName
                  ] || Bot;


                const isRunning =
                  agent.status ===
                    "Running" ||
                  agent.status ===
                    "Active";


                const isActionLoading =
                  agentActionLoading ===
                  agent.id;


                return (

                  <article
                    className="agent-card"
                    key={
                      agent.id
                    }
                  >

                    <div className="agent-card-top">

                      <div
                        className={`large-agent-icon ${agent.color}`}
                      >

                        <AgentIcon
                          size={23}
                        />

                      </div>


                      <div className="agent-status-pill">

                        <span
                          className={`status-indicator ${
                            String(
                              agent.status
                            ).toLowerCase()
                          }`}
                        />

                        {agent.status}

                      </div>

                    </div>


                    <div className="agent-card-content">

                      <div className="agent-category">

                        {agent.category}

                      </div>


                      <h3>

                        {agent.name}

                      </h3>


                      <p>

                        {agent.description}

                      </p>

                    </div>


                    <div className="agent-health">

                      <div className="health-heading">

                        <span>
                          Agent Health
                        </span>

                        <strong>
                          {agent.health}%
                        </strong>

                      </div>


                      <div className="health-bar">

                        <span
                          style={{
                            width:
                              `${agent.health}%`,
                          }}
                        />

                      </div>

                    </div>


                    <div className="agent-metrics">

                      <div>

                        <span>
                          Tasks Processed
                        </span>

                        <strong>
                          {agent.tasks}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Last Activity
                        </span>

                        <strong>
                          {agent.lastActivity}
                        </strong>

                      </div>

                    </div>


                    <div className="agent-actions">

                      <button
                        type="button"
                        className="details-button"
                        onClick={() =>
                          toggleAgentStatus(
                            agent
                          )
                        }
                        disabled={
                          isActionLoading
                        }
                      >

                        {isActionLoading
                          ? "Please wait..."
                          : isRunning
                          ? "Stop Agent"
                          : "Start Agent"}


                        {!isActionLoading && (

                          <ChevronRight
                            size={15}
                          />

                        )}

                      </button>


                      <button
                        type="button"
                        className="settings-button"
                        onClick={() =>
                          openAgentDetails(
                            agent
                          )
                        }
                        title="View agent details"
                      >

                        <ChevronRight
                          size={17}
                        />

                      </button>


                      <button
                        type="button"
                        className="settings-button"
                        onClick={() =>
                          openConfiguration(
                            agent
                          )
                        }
                        title="Configure agent"
                      >

                        <Settings
                          size={17}
                        />

                      </button>

                    </div>

                  </article>

                );

              }
            )}

          </section>

        )}


      {/* ======================================================
          EMPTY STATE
          ====================================================== */}

      {!loading &&
        filteredAgents.length === 0 && (

          <div className="agents-empty">

            <div>

              <Search size={28} />

            </div>


            <h3>
              No agents found
            </h3>


            <p>

              {agents.length === 0
                ? "Create your first AI agent."
                : "Try changing your search or filter."}

            </p>


            {agents.length === 0 ? (

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(
                    true
                  )
                }
              >

                Create Agent

              </button>

            ) : (

              <button
                type="button"
                onClick={() => {

                  setSearch("");

                  setFilter("All");

                }}
              >

                Clear filters

              </button>

            )}

          </div>

        )}


      {/* ======================================================
          DETAILS MODAL
          ====================================================== */}

      {selectedAgent &&
        !showConfigureModal && (

          <div
            className="agent-modal-overlay"
            onClick={() =>
              setSelectedAgent(null)
            }
          >

            <div
              className="agent-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                type="button"
                className="modal-close"
                onClick={() => {

                  setSelectedAgent(
                    null
                  );

                  setTaskText("");

                  setTaskResponse("");

                  setTaskSources([]);

                }}
              >

                <X size={18} />

              </button>


              <div className="modal-agent-header">

                <div
                  className={`modal-agent-icon ${selectedAgent.color}`}
                >

                  {(() => {

                    const Icon =
                      ICON_MAP[
                        selectedAgent.iconName
                      ] || Bot;


                    return (

                      <Icon
                        size={25}
                      />

                    );

                  })()}

                </div>


                <div>

                  <span>
                    {selectedAgent.category}
                  </span>


                  <h2>
                    {selectedAgent.name}
                  </h2>


                  <div className="modal-status">

                    <span
                      className={`status-indicator ${
                        String(
                          selectedAgent.status
                        ).toLowerCase()
                      }`}
                    />

                    {selectedAgent.status}

                  </div>

                </div>

              </div>


              <div className="modal-divider" />


              <p className="modal-description">

                {selectedAgent.description}

              </p>


              <div className="modal-stats">

                <div>

                  <span>
                    Health
                  </span>

                  <strong>
                    {selectedAgent.health}%
                  </strong>

                </div>


                <div>

                  <span>
                    Tasks
                  </span>

                  <strong>
                    {selectedAgent.tasks}
                  </strong>

                </div>


                <div>

                  <span>
                    AI Model
                  </span>

                  <strong>
                    {selectedAgent.aiModel}
                  </strong>

                </div>

              </div>


              {/* ==================================================
                  EXECUTE AI TASK
                  ================================================== */}

              <div
                style={{
                  marginTop:
                    "22px",
                  paddingTop:
                    "18px",
                  borderTop:
                    "1px solid #edf0f3",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "8px",
                    marginBottom:
                      "10px",
                    color:
                      "#2878df",
                    fontSize:
                      "14px",
                    fontWeight:
                      700,
                  }}
                >

                  <Sparkles
                    size={17}
                  />

                  Execute AI Task

                </div>


                <textarea
                  value={
                    taskText
                  }
                  onChange={(event) =>
                    setTaskText(
                      event.target.value
                    )
                  }
                  placeholder="Enter a task for this agent..."
                  rows={4}
                  disabled={
                    executingTask
                  }
                  style={{
                    width:
                      "100%",
                    minHeight:
                      "95px",
                    padding:
                      "13px",
                    border:
                      "1px solid #dfe5ec",
                    borderRadius:
                      "10px",
                    outline:
                      "none",
                    resize:
                      "vertical",
                    boxSizing:
                      "border-box",
                    fontFamily:
                      "inherit",
                    fontSize:
                      "12px",
                    color:
                      "#303b4a",
                    background:
                      "#ffffff",
                  }}
                />


                <button
                  type="button"
                  onClick={
                    executeTask
                  }
                  disabled={
                    executingTask ||
                    selectedAgent.status !==
                      "Running" &&
                    selectedAgent.status !==
                      "Active"
                  }
                  style={{
                    width:
                      "100%",
                    minHeight:
                      "43px",
                    marginTop:
                      "10px",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    gap:
                      "8px",
                    border:
                      "0",
                    borderRadius:
                      "9px",
                    background:
                      "#2878df",
                    color:
                      "#ffffff",
                    fontFamily:
                      "inherit",
                    fontSize:
                      "12px",
                    fontWeight:
                      600,
                    cursor:
                      executingTask
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      executingTask
                        ? 0.75
                        : 1,
                  }}
                >

                  {executingTask ? (

                    <>

                      <Loader2
                        size={17}
                        className="spin"
                      />

                      Processing AI Task...

                    </>

                  ) : (

                    <>

                      <Sparkles
                        size={17}
                      />

                      Execute Task

                    </>

                  )}

                </button>


                {taskResponse && (

                  <div
                    style={{
                      marginTop:
                        "14px",
                      padding:
                        "16px",
                      border:
                        "1px solid #e3eaf2",
                      borderRadius:
                        "11px",
                      background:
                        "#f8fafc",
                    }}
                  >

                    <div
                      style={{
                        marginBottom:
                          "10px",
                        color:
                          "#2878df",
                        fontSize:
                          "13px",
                        fontWeight:
                          700,
                      }}
                    >

                      Agent Response

                    </div>


                    <div
                      style={{
                        color:
                          "#566474",
                        fontSize:
                          "12px",
                        lineHeight:
                          1.75,
                        whiteSpace:
                          "pre-wrap",
                      }}
                    >

                      {taskResponse}

                    </div>


                    {taskSources.length >
                      0 && (

                      <div
                        style={{
                          marginTop:
                            "15px",
                          paddingTop:
                            "12px",
                          borderTop:
                            "1px solid #e5eaf0",
                        }}
                      >

                        <div
                          style={{
                            marginBottom:
                              "7px",
                            color:
                              "#687586",
                            fontSize:
                              "10px",
                            fontWeight:
                              700,
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.5px",
                          }}
                        >

                          Sources

                        </div>


                        {[
                          ...new Set(
                            taskSources
                          ),
                        ].map(
                          (
                            source,
                            index
                          ) => (

                            <div
                              key={`${source}-${index}`}
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap:
                                  "7px",
                                marginBottom:
                                  "5px",
                                color:
                                  "#7b8795",
                                fontSize:
                                  "10px",
                              }}
                            >

                              <Database
                                size={13}
                              />

                              {source}

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                )}

              </div>


              {/* ==================================================
                  MODAL ACTIONS
                  ================================================== */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="modal-configure"
                  onClick={() =>
                    toggleAgentStatus(
                      selectedAgent
                    )
                  }
                  disabled={
                    agentActionLoading ===
                    selectedAgent.id
                  }
                >

                  <Activity
                    size={17}
                  />


                  {agentActionLoading ===
                  selectedAgent.id
                    ? "Please wait..."
                    : selectedAgent.status ===
                        "Running" ||
                      selectedAgent.status ===
                        "Active"
                    ? "Stop Agent"
                    : "Start Agent"}

                </button>


                <button
                  type="button"
                  className="modal-configure"
                  onClick={() =>
                    openConfiguration(
                      selectedAgent
                    )
                  }
                >

                  <Settings
                    size={17}
                  />

                  Configure Agent

                </button>


                <button
                  type="button"
                  className="modal-delete"
                  onClick={
                    deleteAgent
                  }
                  disabled={
                    saving
                  }
                >

                  Delete Agent

                </button>

              </div>

            </div>

          </div>

        )}


      {/* ======================================================
          CREATE MODAL
          ====================================================== */}

      {showCreateModal && (

        <div
          className="agent-modal-overlay create-agent-overlay"
          onClick={
            closeCreateModal
          }
        >

          <div
            className="create-agent-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="premium-create-header">

              <div className="premium-create-brand">

                <div className="premium-create-icon">

                  <Bot
                    size={24}
                    strokeWidth={1.8}
                  />

                </div>


                <div className="premium-create-heading">

                  <span className="premium-create-eyebrow">
                    OMNIBRAIN
                  </span>

                  <h2>
                    Create New Agent
                  </h2>

                  <p>
                    Configure an intelligent agent for your workspace.
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="premium-create-close"
                onClick={
                  closeCreateModal
                }
              >

                <X size={18} />

              </button>

            </div>


            <div className="premium-create-status">

              <div className="premium-status-left">

                <span className="premium-status-dot" />

                <span>
                  AI Agent Configuration
                </span>

              </div>


              <span className="premium-secure">

                <ShieldCheck
                  size={14}
                />

                Secure

              </span>

            </div>


            <div className="premium-create-form">

              <div className="premium-form-group">

                <div className="premium-label-row">

                  <label htmlFor="agent-name">

                    Agent Name

                    <span>
                      *
                    </span>

                  </label>

                  <small>
                    Required
                  </small>

                </div>


                <p className="premium-field-help">

                  Give your AI agent a clear and recognizable name.

                </p>


                <div className="premium-input-wrapper">

                  <Bot
                    size={17}
                    className="premium-input-icon"
                  />


                  <input
                    id="agent-name"
                    type="text"
                    placeholder="e.g. Operations Analytics Agent"
                    value={
                      newAgentName
                    }
                    onChange={(event) =>
                      setNewAgentName(
                        event.target.value
                      )
                    }
                    autoFocus
                  />

                </div>

              </div>


              <div className="premium-form-group">

                <div className="premium-label-row">

                  <label htmlFor="agent-description">

                    Agent Description

                    <span>
                      *
                    </span>

                  </label>

                  <small>
                    Required
                  </small>

                </div>


                <p className="premium-field-help">

                  Describe the responsibilities and purpose of this agent.

                </p>


                <div className="premium-textarea-wrapper">

                  <textarea
                    id="agent-description"
                    rows={4}
                    placeholder="Describe what this agent should do..."
                    value={
                      newAgentDescription
                    }
                    onChange={(event) =>
                      setNewAgentDescription(
                        event.target.value
                      )
                    }
                  />


                  <span className="premium-character-hint">

                    Define the agent's primary responsibilities

                  </span>

                </div>

              </div>


              <div className="premium-form-group">

                <div className="premium-label-row">

                  <label htmlFor="agent-category">

                    Agent Type

                    <span>
                      *
                    </span>

                  </label>

                  <small>
                    Required
                  </small>

                </div>


                <p className="premium-field-help">

                  Select the primary capability of this agent.

                </p>


                <div className="premium-select-wrapper">

                  <div className="premium-select-icon">

                    <Sparkles
                      size={16}
                    />

                  </div>


                  <select
                    id="agent-category"
                    value={
                      newAgentCategory
                    }
                    onChange={(event) =>
                      setNewAgentCategory(
                        event.target.value
                      )
                    }
                  >

                    <option value="Analytics">
                      Analytics
                    </option>

                    <option value="Monitoring">
                      Monitoring
                    </option>

                    <option value="Knowledge">
                      Knowledge
                    </option>

                    <option value="Security">
                      Security
                    </option>

                    <option value="Support">
                      Support
                    </option>

                    <option value="AI / RAG">
                      AI / RAG
                    </option>

                  </select>

                </div>

              </div>

            </div>


            <div className="premium-create-footer">

              <div className="premium-footer-note">

                <ShieldCheck
                  size={14}
                />

                <span>

                  Your agent will start in{" "}

                  <strong>
                    Idle
                  </strong>

                  {" "}mode.

                </span>

              </div>


              <div className="premium-footer-actions">

                <button
                  type="button"
                  className="premium-cancel-button"
                  onClick={
                    closeCreateModal
                  }
                  disabled={
                    saving
                  }
                >

                  Cancel

                </button>


                <button
                  type="button"
                  className="premium-create-button"
                  onClick={
                    createAgent
                  }
                  disabled={
                    saving
                  }
                >

                  <Plus
                    size={17}
                  />

                  {saving
                    ? "Creating..."
                    : "Create Agent"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          CONFIGURE MODAL
          ====================================================== */}

      {showConfigureModal &&
        selectedAgent && (

          <div
            className="agent-modal-overlay create-agent-overlay"
            onClick={
              closeConfiguration
            }
          >

            <div
              className="create-agent-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="premium-create-header">

                <div className="premium-create-brand">

                  <div className="premium-create-icon">

                    <Settings
                      size={24}
                      strokeWidth={1.8}
                    />

                  </div>


                  <div className="premium-create-heading">

                    <span className="premium-create-eyebrow">
                      OMNIBRAIN
                    </span>

                    <h2>
                      Configure Agent
                    </h2>

                    <p>
                      Customize how this AI agent operates.
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="premium-create-close"
                  onClick={
                    closeConfiguration
                  }
                >

                  <X size={18} />

                </button>

              </div>


              <div className="premium-create-status">

                <div className="premium-status-left">

                  <span className="premium-status-dot" />

                  <span>
                    Agent Configuration
                  </span>

                </div>


                <span className="premium-secure">

                  <ShieldCheck
                    size={14}
                  />

                  Secure

                </span>

              </div>


              <div className="premium-create-form">

                <div className="premium-form-group">

                  <div className="premium-label-row">

                    <label>
                      Agent Name
                      <span>*</span>
                    </label>

                  </div>


                  <div className="premium-input-wrapper">

                    <Bot
                      size={17}
                      className="premium-input-icon"
                    />


                    <input
                      type="text"
                      value={
                        configName
                      }
                      onChange={(event) =>
                        setConfigName(
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>


                <div className="premium-form-group">

                  <div className="premium-label-row">

                    <label>
                      Agent Description
                      <span>*</span>
                    </label>

                  </div>


                  <div className="premium-textarea-wrapper">

                    <textarea
                      rows={4}
                      value={
                        configDescription
                      }
                      onChange={(event) =>
                        setConfigDescription(
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>


                <div className="premium-form-group">

                  <div className="premium-label-row">

                    <label>
                      Agent Type
                      <span>*</span>
                    </label>

                  </div>


                  <div className="premium-select-wrapper">

                    <div className="premium-select-icon">

                      <Sparkles
                        size={16}
                      />

                    </div>


                    <select
                      value={
                        configCategory
                      }
                      onChange={(event) =>
                        setConfigCategory(
                          event.target.value
                        )
                      }
                    >

                      <option value="Analytics">
                        Analytics
                      </option>

                      <option value="Monitoring">
                        Monitoring
                      </option>

                      <option value="Knowledge">
                        Knowledge
                      </option>

                      <option value="Security">
                        Security
                      </option>

                      <option value="Support">
                        Support
                      </option>

                      <option value="AI / RAG">
                        AI / RAG
                      </option>

                    </select>

                  </div>

                </div>


                <div className="premium-form-group">

                  <div className="premium-label-row">

                    <label>
                      AI Model
                    </label>

                  </div>


                  <div className="premium-select-wrapper">

                    <div className="premium-select-icon">

                      <BrainCircuit
                        size={16}
                      />

                    </div>


                    <select
                      value={
                        configModel
                      }
                      onChange={(event) =>
                        setConfigModel(
                          event.target.value
                        )
                      }
                    >

                      <option value="GPT-4o">
                        GPT-4o
                      </option>

                      <option value="GPT-4o-mini">
                        GPT-4o Mini
                      </option>

                      <option value="Local LLM">
                        Local LLM
                      </option>

                    </select>

                  </div>

                </div>


                <div className="premium-form-group">

                  <div className="premium-label-row">

                    <label>
                      System Instructions
                    </label>

                  </div>


                  <div className="premium-textarea-wrapper">

                    <textarea
                      rows={5}
                      value={
                        configInstructions
                      }
                      onChange={(event) =>
                        setConfigInstructions(
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>


                <div className="premium-form-group">

                  <div className="premium-label-row">

                    <label>
                      Temperature
                    </label>

                    <small>
                      {Number(
                        configTemperature
                      ).toFixed(1)}
                    </small>

                  </div>


                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={
                      configTemperature
                    }
                    onChange={(event) =>
                      setConfigTemperature(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    style={{
                      width:
                        "100%",
                    }}
                  />

                </div>

              </div>


              <div className="premium-create-footer">

                <div className="premium-footer-note">

                  <ShieldCheck
                    size={14}
                  />

                  <span>

                    Changes will be saved to{" "}

                    <strong>
                      PostgreSQL
                    </strong>.

                  </span>

                </div>


                <div className="premium-footer-actions">

                  <button
                    type="button"
                    className="premium-cancel-button"
                    onClick={
                      closeConfiguration
                    }
                    disabled={
                      saving
                    }
                  >

                    Cancel

                  </button>


                  <button
                    type="button"
                    className="premium-create-button"
                    onClick={
                      saveConfiguration
                    }
                    disabled={
                      saving
                    }
                  >

                    <CheckCircle2
                      size={17}
                    />


                    {saving
                      ? "Saving..."
                      : "Save Configuration"}

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}


export default AIAgents;