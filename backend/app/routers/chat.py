from fastapi import APIRouter
from pydantic import BaseModel
import requests

from backend.app.agents.self_rag.retrieval_service import (
    RetrievalService,
)


# ============================================================
# OMNIBRAIN CHAT ROUTER
# ============================================================

router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class ChatRequest(BaseModel):
    message: str


# ============================================================
# OLLAMA CONFIGURATION
# ============================================================

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

OLLAMA_MODEL = "llama3.2"


# ============================================================
# RAG SERVICE
# ============================================================

retrieval_service = RetrievalService()


# ============================================================
# SOURCE NAME CLEANER
# ============================================================

def clean_source_name(source: str) -> str:
    """
    Convert an internal stored filename into a
    user-friendly document filename.

    Example:

    184b2e7895ae41c78523c078d6d48bf4_Industrial Safety Guidelines.txt

    becomes:

    Industrial Safety Guidelines.txt
    """

    if not source:
        return "Unknown"

    source = str(source).strip()

    # Remove internal hash / ID prefix
    if "_" in source:
        source = source.split("_", 1)[1]

    return source


# ============================================================
# AGENT ROUTING
# ============================================================

def select_agent(question: str):

    text = question.lower()

    # --------------------------------------------------------
    # KNOWLEDGE AGENT
    # --------------------------------------------------------

    knowledge_keywords = [
        "document",
        "knowledge",
        "safety",
        "industrial",
        "procedure",
        "manual",
        "policy",
        "ppe",
        "lockout",
        "tagout",
        "loto",
        "machine safety",
        "emergency",
        "fire safety",
        "training",
        "hazard",
        "incident",
    ]

    if any(
        keyword in text
        for keyword in knowledge_keywords
    ):
        return {
            "name": "Knowledge Agent",
            "type": "knowledge",
            "description": (
                "Retrieves and analyzes information "
                "from the OmniBrain knowledge base."
            ),
        }

    # --------------------------------------------------------
    # ANALYTICS AGENT
    # --------------------------------------------------------

    analytics_keywords = [
        "analytics",
        "analysis",
        "statistics",
        "statistic",
        "performance",
        "tasks",
        "trend",
        "report",
        "data",
        "percentage",
        "average",
        "count",
        "compare",
    ]

    if any(
        keyword in text
        for keyword in analytics_keywords
    ):
        return {
            "name": "Analytics Agent",
            "type": "analytics",
            "description": (
                "Analyzes operational data, "
                "statistics and performance."
            ),
        }

    # --------------------------------------------------------
    # MONITORING AGENT
    # --------------------------------------------------------

    monitoring_keywords = [
        "monitor",
        "monitoring",
        "status",
        "uptime",
        "online",
        "offline",
        "system health",
        "health",
        "service",
        "services",
        "running",
        "active",
        "idle",
        "alert",
        "alerts",
        "outage",
    ]

    if any(
        keyword in text
        for keyword in monitoring_keywords
    ):
        return {
            "name": "Monitoring Agent",
            "type": "monitoring",
            "description": (
                "Monitors system status, services "
                "and operational health."
            ),
        }

    # --------------------------------------------------------
    # SECURITY AGENT
    # --------------------------------------------------------

    security_keywords = [
        "security",
        "secure",
        "authentication",
        "authorization",
        "password",
        "access",
        "permission",
        "attack",
        "threat",
        "vulnerability",
        "breach",
    ]

    if any(
        keyword in text
        for keyword in security_keywords
    ):
        return {
            "name": "Security Agent",
            "type": "security",
            "description": (
                "Handles security-related questions "
                "and operational risks."
            ),
        }

    # --------------------------------------------------------
    # GENERAL AI AGENT
    # --------------------------------------------------------

    return {
        "name": "General AI Agent",
        "type": "general",
        "description": (
            "Handles general questions and "
            "requests that do not require a "
            "specialized agent."
        ),
    }


# ============================================================
# BUILD AGENT PROMPT
# ============================================================

def build_agent_prompt(
    agent,
    question,
    context,
):

    # --------------------------------------------------------
    # KNOWLEDGE AGENT
    # --------------------------------------------------------

    if agent["type"] == "knowledge":

        if context:

            return f"""
You are OmniBrain's Knowledge Agent.

Your job is to answer the user's question using
the retrieved information from the OmniBrain
industrial knowledge base.

IMPORTANT RULES:

1. Use the retrieved knowledge as the primary source.

2. Do not invent facts.

3. Do not invent sensor readings.

4. Do not invent machine conditions.

5. Do not invent alerts or measurements.

6. If the retrieved information does not answer
   the question, clearly say that the knowledge
   base does not contain enough information.

7. Do not pretend that general knowledge came
   from the uploaded documents.

8. Give a concise, clear and professional answer.

9. When useful, mention the source document.

10. Never invent section numbers.

11. Never write placeholders such as:
    "[insert relevant section number]"
    or
    "[insert relevant section numbers]".

12. Never expose internal document IDs, hashes,
    stored filenames or database IDs.

13. Refer to documents using their normal
    human-readable filename only.

14. Do not mention the internal RAG system,
    ChromaDB, embeddings or vector database
    to the user unless specifically asked.

15. Answer only from the retrieved knowledge
    when the question is document-specific.

RETRIEVED KNOWLEDGE:

{context}

USER QUESTION:

{question}

ANSWER:
"""

        return f"""
You are OmniBrain's Knowledge Agent.

No relevant information was found in the
OmniBrain knowledge base.

IMPORTANT RULES:

1. Do not pretend that information came from
   the uploaded documents.

2. If you provide general information, clearly
   identify it as general guidance.

3. Do not invent industrial measurements.

4. Do not invent sensor readings.

5. Do not invent machine conditions.

6. Do not invent alerts.

7. Do not invent machine-specific information.

8. Do not invent document sections or sources.

USER QUESTION:

{question}

ANSWER:
"""

    # --------------------------------------------------------
    # ANALYTICS AGENT
    # --------------------------------------------------------

    if agent["type"] == "analytics":

        return f"""
You are OmniBrain's Analytics Agent.

Your responsibility is to analyze available
operational information and explain statistics,
trends and performance.

IMPORTANT RULES:

- Never invent numerical data.
- Never create fake statistics.
- Clearly distinguish known information
  from assumptions.
- If required data is unavailable, say so.
- Do not claim real-time analytics unless
  the available information confirms it.
- Keep the response concise and useful.

AVAILABLE INFORMATION:

{context if context else "No relevant analytical data was retrieved."}

USER QUESTION:

{question}

ANSWER:
"""

    # --------------------------------------------------------
    # MONITORING AGENT
    # --------------------------------------------------------

    if agent["type"] == "monitoring":

        return f"""
You are OmniBrain's Monitoring Agent.

Your responsibility is to discuss system health,
agent status, services and operational monitoring.

IMPORTANT RULES:

- Never invent live monitoring values.
- Never claim a service is online unless
  available information confirms it.
- Never invent alerts.
- Never invent uptime values.
- Clearly state when live information
  is unavailable.
- Keep the response concise and professional.

AVAILABLE INFORMATION:

{context if context else "No live monitoring information was retrieved."}

USER QUESTION:

{question}

ANSWER:
"""

    # --------------------------------------------------------
    # SECURITY AGENT
    # --------------------------------------------------------

    if agent["type"] == "security":

        return f"""
You are OmniBrain's Security Agent.

Your responsibility is to provide safe and
professional guidance about security,
authentication, access control and
operational risks.

IMPORTANT RULES:

- Do not invent security incidents.
- Do not claim a system is vulnerable
  without evidence.
- Distinguish general recommendations
  from confirmed system information.
- Do not invent security events.
- Prioritize practical defensive guidance.
- Keep the response concise and professional.

AVAILABLE KNOWLEDGE:

{context if context else "No specific security information was retrieved."}

USER QUESTION:

{question}

ANSWER:
"""

    # --------------------------------------------------------
    # GENERAL AI AGENT
    # --------------------------------------------------------

    return f"""
You are OmniBrain's General AI Agent.

Answer the user's question clearly,
accurately and professionally.

If retrieved knowledge is relevant,
use it appropriately.

IMPORTANT RULES:

- Do not invent industrial measurements.
- Do not invent sensor readings.
- Do not invent machine conditions.
- Do not invent alerts.
- Clearly distinguish available information
  from assumptions.
- Keep the response concise and useful.

AVAILABLE KNOWLEDGE:

{context if context else "No relevant knowledge was retrieved."}

USER QUESTION:

{question}

ANSWER:
"""


# ============================================================
# CHAT ENDPOINT
# ============================================================

@router.post("/")
def chat(request: ChatRequest):

    question = request.message.strip()

    # --------------------------------------------------------
    # EMPTY QUESTION
    # --------------------------------------------------------

    if not question:

        return {
            "reply": "Please enter a question.",
            "sources": [],
            "agent": "General AI Agent",
            "agent_type": "general",
        }

    selected_agent = None

    try:

        # ====================================================
        # 1. SELECT AGENT
        # ====================================================

        selected_agent = select_agent(
            question
        )

        print(
            f"🤖 Selected Agent: "
            f"{selected_agent['name']}"
        )

        # ====================================================
        # 2. RETRIEVE KNOWLEDGE
        # ====================================================

        documents = retrieval_service.search(
            query=question,
            top_k=3,
        )

        print(
            f"📚 Retrieved chunks: "
            f"{len(documents)}"
        )

        # ====================================================
        # 3. BUILD CONTEXT
        # ====================================================

        context_parts = []

        sources = []

        for index, document in enumerate(
            documents,
            start=1,
        ):

            # ----------------------------------------------
            # Get original source
            # ----------------------------------------------

            raw_source = document.get(
                "source",
                "Unknown",
            )

            # ----------------------------------------------
            # Clean internal filename
            # ----------------------------------------------

            source = clean_source_name(
                raw_source
            )

            # ----------------------------------------------
            # Get document text
            # ----------------------------------------------

            text = document.get(
                "text",
                "",
            ).strip()

            # ----------------------------------------------
            # Ignore empty chunks
            # ----------------------------------------------

            if not text:
                continue

            # ----------------------------------------------
            # Add retrieved knowledge
            # ----------------------------------------------

            context_parts.append(
                f"[Source {index}: {source}]\n{text}"
            )

            # ----------------------------------------------
            # Add unique source
            # ----------------------------------------------

            if source not in sources:

                sources.append(
                    source
                )

        # ====================================================
        # FINAL CONTEXT
        # ====================================================

        context = "\n\n".join(
            context_parts
        )

        # ====================================================
        # 4. BUILD SPECIALIZED PROMPT
        # ====================================================

        prompt = build_agent_prompt(
            selected_agent,
            question,
            context,
        )

        # ====================================================
        # 5. SEND REQUEST TO OLLAMA
        # ====================================================

        print(
            f"🧠 Sending request to Ollama "
            f"using model: {OLLAMA_MODEL}"
        )

        response = requests.post(
            OLLAMA_URL,

            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            },

            timeout=120,
        )

        response.raise_for_status()

        data = response.json()

        reply = data.get(
            "response",
            "",
        ).strip()

        # ====================================================
        # 6. EMPTY AI RESPONSE
        # ====================================================

        if not reply:

            return {
                "reply": (
                    "OmniBrain AI did not "
                    "return a response."
                ),

                "sources": sources,

                "agent": selected_agent["name"],

                "agent_type": selected_agent["type"],
            }

        # ====================================================
        # 7. RETURN RESPONSE
        # ====================================================

        return {

            "reply": reply,

            "sources": sources,

            "agent": selected_agent["name"],

            "agent_type": selected_agent["type"],
        }

    # ========================================================
    # OLLAMA CONNECTION ERROR
    # ========================================================

    except requests.exceptions.ConnectionError:

        return {

            "reply": (
                "Ollama is not running. "
                "Please start Ollama and try again."
            ),

            "sources": [],

            "agent": (
                selected_agent["name"]
                if selected_agent
                else "General AI Agent"
            ),

            "agent_type": (
                selected_agent["type"]
                if selected_agent
                else "general"
            ),
        }

    # ========================================================
    # OLLAMA TIMEOUT
    # ========================================================

    except requests.exceptions.Timeout:

        return {

            "reply": (
                "The AI took too long to respond. "
                "Please try again."
            ),

            "sources": [],

            "agent": (
                selected_agent["name"]
                if selected_agent
                else "General AI Agent"
            ),

            "agent_type": (
                selected_agent["type"]
                if selected_agent
                else "general"
            ),
        }

    # ========================================================
    # OTHER ERROR
    # ========================================================

    except Exception as e:

        print(
            f"❌ OmniBrain Chat Error: {e}"
        )

        return {

            "reply": (
                "OmniBrain encountered "
                "an unexpected error. "
                "Please try again."
            ),

            "sources": [],

            "agent": (
                selected_agent["name"]
                if selected_agent
                else "General AI Agent"
            ),

            "agent_type": (
                selected_agent["type"]
                if selected_agent
                else "general"
            ),
        }