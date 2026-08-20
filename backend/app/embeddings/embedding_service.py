from sentence_transformers import SentenceTransformer
from typing import List


class EmbeddingService:

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2"
    ):
        print("Loading embedding model...")

        self.model = SentenceTransformer(model_name)

        print("Embedding model loaded successfully.")

    def embed_text(self, text: str) -> List[float]:

        if not text or not text.strip():
            raise ValueError("Text cannot be empty.")

        embedding = self.model.encode(
            text,
            normalize_embeddings=True
        )

        return embedding.tolist()

    def embed_query(self, query: str) -> List[float]:

        if not query or not query.strip():
            raise ValueError("Query cannot be empty.")

        return self.embed_text(query)

    def embed_documents(
        self,
        documents: List[str]
    ) -> List[List[float]]:

        if not documents:
            return []

        embeddings = self.model.encode(
            documents,
            normalize_embeddings=True
        )

        return embeddings.tolist()


if __name__ == "__main__":

    service = EmbeddingService()

    result = service.embed_text(
        "OmniBrain is an industrial AI platform."
    )

    print("Embedding generated successfully.")
    print("Dimensions:", len(result))

    query_result = service.embed_query(
        "What personal protective equipment is required?"
    )

    print("Query embedding generated successfully.")
    print("Query dimensions:", len(query_result))