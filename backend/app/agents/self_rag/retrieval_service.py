from backend.app.embeddings.embedding_service import EmbeddingService
from backend.app.agents.self_rag.vector_store import search_documents


class RetrievalService:
    """
    Retrieves relevant knowledge from the OmniBrain
    ChromaDB vector database.
    """

    # --------------------------------------------------------
    # RELEVANCE THRESHOLD
    # --------------------------------------------------------

    # ChromaDB returns distances.
    # Smaller distance = more similar.
    #
    # Start conservatively.
    # We can tune this later based on testing.

    DEFAULT_DISTANCE_THRESHOLD = 1.20

    def __init__(self):
        self.embedding_service = EmbeddingService()

    # --------------------------------------------------------
    # SEARCH
    # --------------------------------------------------------

    def search(
        self,
        query: str,
        top_k: int = 5,
        distance_threshold: float = DEFAULT_DISTANCE_THRESHOLD,
    ):
        """
        Convert the user's question into an embedding
        and retrieve relevant chunks from ChromaDB.
        """

        # ----------------------------------------------------
        # VALIDATE QUERY
        # ----------------------------------------------------

        if not query or not query.strip():
            return []

        query = query.strip()

        # ----------------------------------------------------
        # GENERATE QUERY EMBEDDING
        # ----------------------------------------------------

        query_embedding = (
            self.embedding_service.embed_query(query)
        )

        if not query_embedding:
            return []

        # ----------------------------------------------------
        # SEARCH VECTOR DATABASE
        # ----------------------------------------------------

        results = search_documents(
            embedding=query_embedding,
            top_k=top_k,
        )

        documents = results.get(
            "documents",
            [[]]
        )[0]

        metadatas = results.get(
            "metadatas",
            [[]]
        )[0]

        distances = results.get(
            "distances",
            [[]]
        )[0]

        # ----------------------------------------------------
        # NO RESULTS
        # ----------------------------------------------------

        if not documents:
            print("📚 Retrieved chunks: 0")
            return []

        # ----------------------------------------------------
        # BUILD RETRIEVED RESULTS
        # ----------------------------------------------------

        retrieved = []

        for i, document in enumerate(documents):

            if not document:
                continue

            metadata = (
                metadatas[i]
                if i < len(metadatas)
                else {}
            )

            distance = (
                distances[i]
                if i < len(distances)
                else None
            )

            # ------------------------------------------------
            # FILTER WEAK RESULTS
            # ------------------------------------------------

            if distance is not None:

                try:
                    distance_value = float(distance)

                except (TypeError, ValueError):
                    distance_value = None

                if (
                    distance_value is not None
                    and distance_value
                    > distance_threshold
                ):
                    print(
                        f"⚠️ Skipping weak match "
                        f"(distance={distance_value:.4f})"
                    )
                    continue

            # ------------------------------------------------
            # SOURCE NAME
            # ------------------------------------------------

            source = metadata.get(
                "source",
                "Unknown"
            )

            # ------------------------------------------------
            # CHUNK INDEX
            # ------------------------------------------------

            chunk_index = metadata.get(
                "chunk_index"
            )

            # ------------------------------------------------
            # ADD RESULT
            # ------------------------------------------------

            retrieved.append(
                {
                    "text": document.strip(),

                    "source": source,

                    "chunk_index": chunk_index,

                    "distance": distance,
                }
            )

        # ----------------------------------------------------
        # SORT BY RELEVANCE
        # ----------------------------------------------------

        retrieved.sort(
            key=lambda item: (
                float(item["distance"])
                if item["distance"] is not None
                else float("inf")
            )
        )

        print(
            f"📚 Retrieved chunks: "
            f"{len(retrieved)}"
        )

        # ----------------------------------------------------
        # RETURN
        # ----------------------------------------------------

        return retrieved


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    service = RetrievalService()

    query = (
        "What personal protective equipment "
        "is required in industrial work areas?"
    )

    results = service.search(
        query=query,
        top_k=3,
    )

    print("\n==============================")
    print("RAG RETRIEVAL TEST")
    print("==============================")

    print(
        "Query:",
        query
    )

    print(
        "Retrieved documents:",
        len(results)
    )

    for index, result in enumerate(
        results,
        start=1,
    ):

        print(
            f"\n--- Result {index} ---"
        )

        print(
            "Source:",
            result["source"]
        )

        print(
            "Chunk:",
            result["chunk_index"]
        )

        print(
            "Distance:",
            result["distance"]
        )

        print("Text:")

        print(
            result["text"][:500]
        )