from pathlib import Path
from typing import List
import re


# ============================================================
# LOAD TXT
# ============================================================

def load_text_file(file_path: str) -> str:
    """
    Load a plain text file.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"File not found: {file_path}"
        )

    return path.read_text(
        encoding="utf-8",
        errors="ignore"
    )


# ============================================================
# LOAD DOCUMENT
# ============================================================

def load_document(file_path: str) -> str:
    """
    Load a supported document and return its text.

    Supported:
    - TXT
    - PDF
    - DOCX
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"File not found: {file_path}"
        )

    extension = path.suffix.lower()

    # --------------------------------------------------------
    # TXT
    # --------------------------------------------------------

    if extension == ".txt":

        return load_text_file(file_path)

    # --------------------------------------------------------
    # PDF
    # --------------------------------------------------------

    if extension == ".pdf":

        from pypdf import PdfReader

        reader = PdfReader(file_path)

        pages = []

        for page in reader.pages:

            text = page.extract_text()

            if text and text.strip():
                pages.append(text.strip())

        return "\n\n".join(pages)

    # --------------------------------------------------------
    # DOCX
    # --------------------------------------------------------

    if extension == ".docx":

        from docx import Document

        document = Document(file_path)

        paragraphs = []

        for paragraph in document.paragraphs:

            text = paragraph.text.strip()

            if text:
                paragraphs.append(text)

        return "\n\n".join(paragraphs)

    # --------------------------------------------------------
    # UNSUPPORTED
    # --------------------------------------------------------

    raise ValueError(
        f"Unsupported file type: {extension}. "
        "Supported formats are TXT, PDF and DOCX."
    )


# ============================================================
# NORMALIZE TEXT
# ============================================================

def normalize_text(text: str) -> str:
    """
    Clean unnecessary whitespace while preserving
    paragraph boundaries.
    """

    if not text:
        return ""

    # Normalize Windows/Mac line endings
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Remove excessive spaces/tabs
    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )

    # Prevent huge numbers of blank lines
    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )

    return text.strip()


# ============================================================
# SPLIT TEXT
# ============================================================

def split_text(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> List[str]:
    """
    Split text into meaningful overlapping chunks.

    The splitter tries to preserve:
    - paragraphs
    - sentences
    - complete words

    This produces better chunks for RAG retrieval.
    """

    if not text or not text.strip():
        return []

    if chunk_size <= 0:
        raise ValueError(
            "chunk_size must be greater than 0."
        )

    if chunk_overlap < 0:
        raise ValueError(
            "chunk_overlap cannot be negative."
        )

    if chunk_overlap >= chunk_size:
        raise ValueError(
            "chunk_overlap must be smaller than chunk_size."
        )

    text = normalize_text(text)

    # --------------------------------------------------------
    # First split into paragraphs
    # --------------------------------------------------------

    paragraphs = [
        paragraph.strip()
        for paragraph in text.split("\n\n")
        if paragraph.strip()
    ]

    chunks = []

    current_chunk = ""

    # --------------------------------------------------------
    # Build chunks paragraph by paragraph
    # --------------------------------------------------------

    for paragraph in paragraphs:

        # ----------------------------------------------------
        # If paragraph fits into current chunk
        # ----------------------------------------------------

        if (
            current_chunk
            and len(current_chunk)
            + len(paragraph)
            + 2
            <= chunk_size
        ):

            current_chunk += (
                "\n\n" + paragraph
            )

            continue

        # ----------------------------------------------------
        # Save current chunk before starting another
        # ----------------------------------------------------

        if current_chunk:

            chunks.append(
                current_chunk.strip()
            )

        # ----------------------------------------------------
        # Large paragraph
        # ----------------------------------------------------

        if len(paragraph) > chunk_size:

            sentences = re.split(
                r"(?<=[.!?])\s+",
                paragraph
            )

            current_chunk = ""

            for sentence in sentences:

                sentence = sentence.strip()

                if not sentence:
                    continue

                # --------------------------------------------
                # Sentence fits
                # --------------------------------------------

                if (
                    current_chunk
                    and len(current_chunk)
                    + len(sentence)
                    + 1
                    <= chunk_size
                ):

                    current_chunk += (
                        " " + sentence
                    )

                # --------------------------------------------
                # Sentence doesn't fit
                # --------------------------------------------

                elif (
                    current_chunk
                    and len(current_chunk)
                    + len(sentence)
                    + 1
                    > chunk_size
                ):

                    chunks.append(
                        current_chunk.strip()
                    )

                    # Keep a small overlap
                    overlap_text = (
                        current_chunk[
                            -chunk_overlap:
                        ]
                    )

                    current_chunk = (
                        overlap_text
                        + " "
                        + sentence
                    )

                else:

                    # ----------------------------------------
                    # Extremely long individual sentence
                    # ----------------------------------------

                    if len(sentence) > chunk_size:

                        start = 0

                        while start < len(sentence):

                            end = (
                                start
                                + chunk_size
                            )

                            piece = (
                                sentence[start:end]
                                .strip()
                            )

                            if piece:
                                chunks.append(
                                    piece
                                )

                            if end >= len(sentence):
                                break

                            start = (
                                end
                                - chunk_overlap
                            )

                        current_chunk = ""

                    else:

                        current_chunk = sentence

        else:

            current_chunk = paragraph

    # --------------------------------------------------------
    # Add final chunk
    # --------------------------------------------------------

    if current_chunk.strip():

        chunks.append(
            current_chunk.strip()
        )

    # --------------------------------------------------------
    # Remove duplicates / tiny chunks
    # --------------------------------------------------------

    cleaned_chunks = []

    for chunk in chunks:

        chunk = chunk.strip()

        if not chunk:
            continue

        if (
            cleaned_chunks
            and chunk == cleaned_chunks[-1]
        ):
            continue

        cleaned_chunks.append(chunk)

    return cleaned_chunks


# ============================================================
# LOAD + SPLIT
# ============================================================

def load_and_split_document(
    file_path: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> List[str]:
    """
    Load a document and split it into
    RAG-friendly chunks.
    """

    text = load_document(file_path)

    return split_text(
        text=text,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print(
        "Document loader ready."
    )