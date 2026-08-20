import os
import chromadb


# ============================================================
# VECTOR DATABASE CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.abspath(__file__)
            )
        )
    )
)

VECTOR_DB_PATH = os.path.join(
    BASE_DIR,
    "vector_db"
)

print("VECTOR DB PATH:", VECTOR_DB_PATH)


# ============================================================
# CHROMADB
# ============================================================

client = chromadb.PersistentClient(
    path=VECTOR_DB_PATH
)

collection = client.get_or_create_collection(
    name="omnibrain_knowledge"
)


# ============================================================
# ADD SINGLE DOCUMENT
# ============================================================

def add_document(
    document_id: str,
    text: str,
    embedding: list,
    source: str
):
    collection.add(
        ids=[document_id],
        documents=[text],
        embeddings=[embedding],
        metadatas=[
            {
                "source": source
            }
        ]
    )


# ============================================================
# ADD MULTIPLE DOCUMENT CHUNKS
# ============================================================

def add_documents(
    documents,
    embeddings,
    metadatas,
    ids
):
    if not documents:
        return

    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )


# ============================================================
# SEARCH VECTOR DATABASE
# ============================================================

def search_documents(
    embedding: list,
    top_k: int = 5
):

    print(
        "COLLECTION COUNT:",
        collection.count()
    )

    print(
        "EMBEDDING LENGTH:",
        len(embedding) if embedding else 0
    )

    # --------------------------------------------------------
    # Validate embedding
    # --------------------------------------------------------

    if not embedding:
        return {
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]]
        }

    # --------------------------------------------------------
    # Convert embedding values to floats
    # --------------------------------------------------------

    try:

        query_embedding = [
            float(value)
            for value in embedding
        ]

    except (TypeError, ValueError):

        return {
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]]
        }

    # --------------------------------------------------------
    # Check whether database contains documents
    # --------------------------------------------------------

    document_count = collection.count()

    if document_count == 0:
        return {
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]]
        }

    # --------------------------------------------------------
    # Search ChromaDB
    # --------------------------------------------------------

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(
            top_k,
            document_count
        )
    )

    return results


# ============================================================
# DOCUMENT / CHUNK COUNT
# ============================================================

def get_document_count():

    return collection.count()


# ============================================================
# DELETE DOCUMENT CHUNKS BY SOURCE
# ============================================================

def delete_documents_by_source(source: str) -> int:
    """
    Delete all indexed ChromaDB chunks belonging
    to a specific source file.

    Returns:
        Number of deleted chunks.
    """

    if not source:
        return 0

    # --------------------------------------------------------
    # Find all chunks belonging to this source
    # --------------------------------------------------------

    results = collection.get(
        where={
            "source": source
        }
    )

    ids = results.get(
        "ids",
        []
    )

    # --------------------------------------------------------
    # Nothing found
    # --------------------------------------------------------

    if not ids:
        print(
            f"No chunks found for source: {source}"
        )

        return 0

    # --------------------------------------------------------
    # Delete chunks
    # --------------------------------------------------------

    collection.delete(
        ids=ids
    )

    print(
        f"Deleted {len(ids)} chunks for source: {source}"
    )

    return len(ids)


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print(
        "Vector DB Path:",
        VECTOR_DB_PATH
    )

    print(
        "Documents / Chunks:",
        get_document_count()
    )