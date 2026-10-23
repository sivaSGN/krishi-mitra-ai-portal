"""
=============================================================================
Krishi Mitra AI Portal - Layer 2: RAG Vector Index Creator (create_index.py)
=============================================================================

This script reads the agricultural schemes dataset, splits it into individual
scheme chunks, generates multilingual semantic embeddings using Hugging Face's
intfloat/multilingual-e5-small via SentenceTransformers, and stores them into
a FAISS vector index alongside serialized chunk metadata.

Prefix conventions for E5 models:
- Document passages must be prefixed with 'passage: '
- Queries must be prefixed with 'query: '
=============================================================================
"""

import os
import sys
import pickle
import shutil
from datetime import datetime

# Check required dependencies with clear actionable error messages
try:
    import numpy as np
    import faiss
    from sentence_transformers import SentenceTransformer
except ImportError as e:
    missing_mod = getattr(e, "name", str(e))
    raise ImportError(
        f"Missing required dependency: '{missing_mod}'. "
        f"Please install all required dependencies by running:\n"
        f"    pip install -r requirements.txt"
    ) from e

# Set terminal stdout encoding to UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------
DATA_FILE_PATH = os.path.join("data", "farmer_schemes.txt")
INDEX_OUTPUT_PATH = "scheme_index.faiss"
CHUNKS_OUTPUT_PATH = "chunks.pkl"
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "intfloat/multilingual-e5-small")
SCHEME_SEPARATOR = "=== SCHEME SEPARATOR ==="


def backup_existing_artifacts(index_path: str, chunks_path: str) -> None:
    """
    Safely backs up existing FAISS index and chunk metadata before overwriting.
    Creates both standard .bak files and timestamped backups in a 'backups/' directory.
    """
    backup_dir = "backups"
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    for file_path in [index_path, chunks_path]:
        if os.path.exists(file_path):
            base_name = os.path.basename(file_path)
            # Create/overwrite standard .bak file
            bak_path = f"{file_path}.bak"
            shutil.copy2(file_path, bak_path)

            # Create timestamped historical backup
            ts_backup_path = os.path.join(backup_dir, f"{base_name}.{timestamp}.bak")
            shutil.copy2(file_path, ts_backup_path)
            print(f"      [Backup] Saved '{file_path}' -> '{bak_path}' & '{ts_backup_path}'")


def load_and_parse_schemes(file_path: str):
    """
    Reads the farmer schemes text file and splits it into structured chunks.
    
    Returns:
        list of dict: Each item contains 'chunk_id', 'scheme_name', and clean 'content'.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(
            f"Dataset file not found at: '{file_path}'. "
            f"Please verify that the schemes file exists in the data directory."
        )

    print(f"[1/4] Reading dataset from: {file_path}")
    with open(file_path, "r", encoding="utf-8") as file:
        raw_text = file.read()

    # Split the text file using the scheme separator
    raw_chunks = raw_text.split(SCHEME_SEPARATOR)
    parsed_chunks = []

    for index, chunk in enumerate(raw_chunks, start=1):
        cleaned_text = chunk.strip()
        if not cleaned_text:
            continue

        # Extract Scheme Name for easy display and metadata tagging
        scheme_name = f"Scheme #{index}"
        for line in cleaned_text.split("\n"):
            if line.startswith("Scheme Name:"):
                scheme_name = line.replace("Scheme Name:", "").strip()
                break

        # Metadata retains the clean scheme text and ID mapping
        parsed_chunks.append({
            "chunk_id": index,
            "scheme_name": scheme_name,
            "content": cleaned_text
        })

    print(f"      Successfully extracted {len(parsed_chunks)} scheme chunks.")
    return parsed_chunks


def generate_embeddings(chunks: list, model_name: str = EMBEDDING_MODEL_NAME):
    """
    Generates sentence embeddings for each scheme chunk using SentenceTransformers.
    In accordance with intfloat/multilingual-e5-small requirements, every document
    chunk is prefixed with 'passage: ' before encoding.
    
    Returns:
        tuple: (numpy array of normalized float32 embeddings, SentenceTransformer model instance)
    """
    print(f"[2/4] Loading embedding model: {model_name}")
    try:
        model = SentenceTransformer(model_name)
    except Exception as e:
        raise RuntimeError(
            f"Failed to download or load embedding model '{model_name}'. "
            f"Please verify your internet connection or local model cache. "
            f"Underlying error: {e}"
        ) from e

    # Multilingual E5 models require 'passage: ' prefix for document passages
    texts = [
        chunk["content"].strip() if chunk["content"].strip().startswith("passage: ")
        else f"passage: {chunk['content'].strip()}"
        for chunk in chunks
    ]

    print(f"[3/4] Generating embeddings for {len(texts)} scheme chunks using {model_name}...")
    try:
        embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    except Exception as e:
        raise RuntimeError(f"Embedding generation failed: {e}") from e

    # Ensure float32 data type for FAISS compatibility
    embeddings = np.array(embeddings, dtype=np.float32)

    # Normalize vectors for Cosine Similarity search with FAISS (Inner Product)
    faiss.normalize_L2(embeddings)

    return embeddings, model


def create_and_save_faiss_index(embeddings: np.ndarray, chunks: list, index_path: str, chunks_path: str):
    """
    Creates a FAISS vector index (IndexFlatIP for cosine similarity) and saves both
    the index file and chunks metadata pickle file. Backs up existing files first.
    """
    print(f"[4/4] Creating FAISS vector index and saving artifacts...")
    # Safe backup of existing files before overwriting
    backup_existing_artifacts(index_path, chunks_path)

    dimension = embeddings.shape[1]

    # IndexFlatIP with L2-normalized vectors computes Cosine Similarity
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)

    # Save the FAISS index to disk
    faiss.write_index(index, index_path)
    print(f"      FAISS index saved to: {index_path} (Total Vectors: {index.ntotal}, Dimension: {dimension})")

    # Save the chunk metadata to disk using pickle
    with open(chunks_path, "wb") as f:
        pickle.dump(chunks, f)
    print(f"      Chunk metadata saved to: {chunks_path} (Total Chunks: {len(chunks)})")


def main():
    """Main execution function to build the vector index."""
    print("=" * 70)
    print("  Krishi Mitra AI - Building RAG Vector Index (Layer 2)")
    print(f"  Embedding Model: {EMBEDDING_MODEL_NAME}")
    print("=" * 70)

    # Step 1: Parse scheme data
    chunks = load_and_parse_schemes(DATA_FILE_PATH)

    # Step 2: Generate vector embeddings with 'passage: ' prefix
    embeddings, _ = generate_embeddings(chunks, EMBEDDING_MODEL_NAME)

    # Step 3: Create and save FAISS index & metadata safely
    create_and_save_faiss_index(embeddings, chunks, INDEX_OUTPUT_PATH, CHUNKS_OUTPUT_PATH)

    print("=" * 70)
    print(" Indexing Complete! You can now run `python search.py` to test retrieval.")
    print("=" * 70)


if __name__ == "__main__":
    main()
