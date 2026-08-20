import requests

from backend.app.agents.self_rag.rag_service import RAGService


# ============================================================
# OLLAMA CONFIGURATION
# ============================================================

OLLAMA_URL = "http://127.0.0.1:11434"
LLM_MODEL = "llama3.2:latest"


# ============================================================
# SELF-RAG AGENT
# ============================================================

class SelfRAG:

    def __init__(self):
        self.rag_service = RAGService()

    def generate_answer(
        self,
        query: str,
        top_k: int = 3
    ) -> str:

        if not query or not query.strip():
            return "Please provide a question."

        # ----------------------------------------------------
        # Retrieve relevant knowledge
        # ----------------------------------------------------

        context = self.rag_service.retrieve_context(
            query=query,
            top_k=top_k
        )

        if not context:
            return (
                "I could not find relevant information "
                "in the knowledge base."
            )

        # ----------------------------------------------------
        # Build grounded prompt
        # ----------------------------------------------------

        prompt = f"""
You are OmniBrain, an industrial AI assistant.

Answer the user's question using ONLY the knowledge
provided in the context below.

Do not invent facts.
Do not use information that is not supported by the context.
If the context does not contain enough information, clearly
say that the available knowledge base does not provide
enough information.

For industrial safety questions:
- Give clear and practical information.
- Do not claim that AI recommendations replace professional
  safety judgment.
- Remind users to follow their organization's approved
  safety procedures when appropriate.

KNOWLEDGE CONTEXT:
------------------
{context}
------------------

USER QUESTION:
{query}

Provide a concise, professional answer.
"""

        # ----------------------------------------------------
        # Call Ollama
        # ----------------------------------------------------

        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": LLM_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        return data.get(
            "response",
            "No answer was generated."
        ).strip()


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    agent = SelfRAG()

    question = (
        "What personal protective equipment "
        "is required in industrial environments?"
    )

    print("\n==============================")
    print("OMNIBRAIN SELF-RAG TEST")
    print("==============================")

    print("\nQuestion:")
    print(question)

    print("\nGenerating answer...\n")

    answer = agent.generate_answer(
        query=question,
        top_k=3
    )

    print("Answer:")
    print(answer)

    print("\n==============================")
    print("TEST COMPLETED")
    print("==============================")