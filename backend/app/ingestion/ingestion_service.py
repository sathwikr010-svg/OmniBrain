from pathlib import Path
from typing import Dict, List

from backend.app.ingestion.document_loader import load_and_split_document
from backend.app.embeddings.embedding_service import EmbeddingService
from backend.app.agents.self_rag.vector_store import (
    add_documents,
    get_document_count,
)


class IngestionService:
    """
    Handles the complete document ingestion pipeline:

    File
      ↓
    Text extraction
      ↓
    Chunking
      ↓
    Embeddings
      ↓
    ChromaDB
    """

    def __init__(self):
        self.embedding_service = EmbeddingService()

    def ingest_document(self, file_path: str) -> Dict:

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Document not found: {file_path}"
            )

        # -----------------------------------
        # 1. Load and split document
        # -----------------------------------

        chunks = load_and_split_document(
            str(path),
            chunk_size=1000,
            chunk_overlap=200,
        )

        if not chunks:
            raise ValueError(
                "The document does not contain readable text."
            )

        # -----------------------------------
        # 2. Generate embeddings
        # -----------------------------------

        embeddings = self.embedding_service.embed_documents(
            chunks
        )

        # -----------------------------------
        # 3. Prepare metadata
        # -----------------------------------

        documents = []
        metadatas = []
        ids = []

        for index, chunk in enumerate(chunks):

            document_id = (
                f"{path.stem}-{index}"
            )

            documents.append(chunk)

            metadatas.append(
                {
                    "source": path.name,
                    "chunk_index": index,
                    "file_type": path.suffix.lower(),
                }
            )

            ids.append(document_id)

        # -----------------------------------
        # 4. Store in ChromaDB
        # -----------------------------------

        add_documents(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )

        # -----------------------------------
        # 5. Return ingestion information
        # -----------------------------------

        return {
            "status": "success",
            "filename": path.name,
            "chunks_created": len(chunks),
            "total_documents": get_document_count(),
        }


if __name__ == "__main__":

    print("Ingestion service ready.")