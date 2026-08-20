from backend.app.ingestion.ingestion_service import IngestionService


if __name__ == "__main__":

    service = IngestionService()

    file_path = "datasets/knowledge/industrial_safety.txt"

    result = service.ingest_document(file_path)

    print("\n==============================")
    print("RAG INGESTION RESULT")
    print("==============================")
    print("Status:", result["status"])
    print("File:", result["filename"])
    print("Chunks:", result["chunks_created"])
    print("Total documents:", result["total_documents"])