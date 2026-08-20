from backend.app.agents.self_rag.retrieval_service import RetrievalService


class RAGService:
    """
    Combines user queries with retrieved knowledge
    to build context for the final AI response.
    """

    def __init__(self):
        self.retrieval_service = RetrievalService()

    def retrieve_context(
        self,
        query: str,
        top_k: int = 3
    ) -> str:

        if not query or not query.strip():
            return ""

        results = self.retrieval_service.search(
            query=query,
            top_k=top_k
        )

        if not results:
            return ""

        context_parts = []

        for index, result in enumerate(results, start=1):

            text = result.get("text", "")
            source = result.get("source", "Unknown")

            if not text:
                continue

            context_parts.append(
                f"[Source {index}: {source}]\n"
                f"{text}"
            )

        return "\n\n".join(context_parts)


if __name__ == "__main__":

    service = RAGService()

    query = (
        "What personal protective equipment "
        "is required in industrial environments?"
    )

    context = service.retrieve_context(
        query=query,
        top_k=3
    )

    print("\n==============================")
    print("RAG CONTEXT TEST")
    print("==============================")

    if context:

        print("Context retrieved successfully.\n")
        print(context)

    else:

        print("No relevant context found.")