from pathlib import Path
import shutil
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

from backend.app.ingestion.ingestion_service import IngestionService

from backend.app.agents.self_rag.vector_store import (
    get_document_count,
    delete_documents_by_source,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/knowledge",
    tags=["Knowledge"],
)


# ============================================================
# DIRECTORIES
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# ALLOWED FILE TYPES
# ============================================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
}


# ============================================================
# HELPER — CREATE SAFE STORED NAME
# ============================================================

def create_stored_filename(original_filename: str) -> str:
    """
    Create a unique internal filename.

    Example:

    Original:
        Industrial Safety Guidelines.txt

    Stored:
        uuid_Industrial Safety Guidelines.txt
    """

    safe_name = Path(
        original_filename
    ).name

    unique_id = uuid.uuid4().hex

    return f"{unique_id}_{safe_name}"


# ============================================================
# HELPER — GET ORIGINAL FILENAME
# ============================================================

def get_original_filename(stored_filename: str) -> str:
    """
    Remove the internal UUID prefix.

    Example:

    uuid_Industrial Safety Guidelines.txt

    becomes:

    Industrial Safety Guidelines.txt
    """

    if "_" not in stored_filename:
        return stored_filename

    return stored_filename.split(
        "_",
        1
    )[1]


# ============================================================
# GET KNOWLEDGE DOCUMENTS
# ============================================================

@router.get("/")
def get_knowledge():
    """
    Return all uploaded knowledge documents.
    """

    documents = []

    if not UPLOAD_DIR.exists():

        return {
            "documents": [],
            "total_documents": 0,
            "indexed_chunks": 0,
        }

    for file_path in UPLOAD_DIR.iterdir():

        if not file_path.is_file():
            continue

        extension = file_path.suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            continue

        stored_name = file_path.name

        display_name = get_original_filename(
            stored_name
        )

        documents.append(
            {
                "name": display_name,

                "stored_name": stored_name,

                "type": extension
                .replace(".", "")
                .upper(),

                "status": "Indexed",
            }
        )

    # Sort documents alphabetically
    documents.sort(
        key=lambda item: item["name"].lower()
    )

    return {
        "documents": documents,

        "total_documents": len(
            documents
        ),

        "indexed_chunks": get_document_count(),
    }


# ============================================================
# UPLOAD KNOWLEDGE
# ============================================================

@router.post("/upload")
async def upload_knowledge(
    file: UploadFile = File(...),
):
    """
    Upload a PDF, DOCX or TXT document
    and index it in ChromaDB.
    """

    # --------------------------------------------------------
    # Validate filename
    # --------------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    original_filename = Path(
        file.filename
    ).name

    extension = Path(
        original_filename
    ).suffix.lower()

    # --------------------------------------------------------
    # Validate extension
    # --------------------------------------------------------

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF, DOCX and TXT "
                "files are supported."
            ),
        )

    # --------------------------------------------------------
    # Create internal filename
    # --------------------------------------------------------

    stored_name = create_stored_filename(
        original_filename
    )

    file_path = UPLOAD_DIR / stored_name

    # --------------------------------------------------------
    # Save uploaded file
    # --------------------------------------------------------

    try:

        with file_path.open("wb") as buffer:

            shutil.copyfileobj(
                file.file,
                buffer,
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to save file: {str(e)}"
            ),
        )

    # --------------------------------------------------------
    # Ingest document
    # --------------------------------------------------------

    try:

        service = IngestionService()

        result = service.ingest_document(
            str(file_path)
        )

        return {
            "message": (
                "Document uploaded and "
                "indexed successfully."
            ),

            # Human-readable filename
            "filename": original_filename,

            # Internal filename
            "stored_name": stored_name,

            "status": "Indexed",

            "chunks_created": result[
                "chunks_created"
            ],

            "total_documents": result[
                "total_documents"
            ],
        }

    except Exception as e:

        # Remove failed upload
        if file_path.exists():

            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Document ingestion failed: {str(e)}"
            ),
        )


# ============================================================
# DELETE KNOWLEDGE
# ============================================================

@router.delete("/{filename}")
def delete_knowledge(
    filename: str,
):
    """
    Delete an uploaded document and all
    corresponding ChromaDB chunks.
    """

    # --------------------------------------------------------
    # Prevent path traversal
    # --------------------------------------------------------

    safe_filename = Path(
        filename
    ).name

    if safe_filename != filename:

        raise HTTPException(
            status_code=400,
            detail="Invalid filename.",
        )

    # --------------------------------------------------------
    # Build file path
    # --------------------------------------------------------

    file_path = (
        UPLOAD_DIR / safe_filename
    )

    # --------------------------------------------------------
    # Check file exists
    # --------------------------------------------------------

    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="File not found.",
        )

    # --------------------------------------------------------
    # Validate extension
    # --------------------------------------------------------

    if (
        file_path.suffix.lower()
        not in ALLOWED_EXTENSIONS
    ):

        raise HTTPException(
            status_code=400,
            detail="Unsupported file type.",
        )

    try:

        # ----------------------------------------------------
        # Delete ChromaDB chunks
        # ----------------------------------------------------

        deleted_chunks = (
            delete_documents_by_source(
                safe_filename
            )
        )

        # ----------------------------------------------------
        # Delete physical file
        # ----------------------------------------------------

        file_path.unlink()

        # ----------------------------------------------------
        # Return result
        # ----------------------------------------------------

        return {
            "message": (
                "Knowledge deleted successfully."
            ),

            "filename": get_original_filename(
                safe_filename
            ),

            "stored_name": safe_filename,

            "deleted_chunks": deleted_chunks,

            "remaining_chunks": get_document_count(),
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to delete knowledge: {str(e)}"
            ),
        )