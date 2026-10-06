"""
=============================================================================
Krishi Mitra AI Portal - Layer 2: RAG Vector Index Creator (create_index.py)
=============================================================================

This script reads the agricultural schemes dataset, splits it into individual
scheme chunks, generates semantic embeddings using SentenceTransformers, and
stores them into a FAISS vector index alongside serialized chunk metadata.
"""

import os
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------
DATA_FILE_PATH = os.path.join("data", "farmer_schemes.txt")
INDEX_OUTPUT_PATH = "scheme_index.faiss"
CHUNKS_OUTPUT_PATH = "chunks.pkl"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
SCHEME_SEPARATOR = "=== SCHEME SEPARATOR ==="


def load_and_parse_schemes(file_path: str):
    """
    Reads the farmer schemes text file and splits it into structured chunks.
    
    Returns:
        list of dict: Each item contains 'id', 'name', 'category', 'text', etc.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at: {file_path}")

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

        parsed_chunks.append({
            "chunk_id": index,
            "scheme_name": scheme_name,
            "content": cleaned_text
        })

    print(f"      Successfully extracted {len(parsed_chunks)} scheme chunks.")
    return parsed_chunks


def generate_embeddings(chunks: list, model_name: str):
    """
    Generates sentence embeddings for each scheme chunk using SentenceTransformers.
    
    Returns:
        tuple: (numpy array of normalized embeddings, SentenceTransformer model instance)
    """
    print(f"[2/4] Loading embedding model: {model_name}")
    model = SentenceTransformer(model_name)

    # Extract text content for embedding
    texts = [chunk["content"] for chunk in chunks]

    print(f"[3/4] Generating embeddings for {len(texts)} scheme chunks...")
    # Convert texts to numpy float32 embeddings
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    embeddings = np.array(embeddings).astype("float32")

    # Normalize vectors for Cosine Similarity search with FAISS (Inner Product)
    faiss.normalize_L2(embeddings)

    return embeddings, model


def create_and_save_faiss_index(embeddings: np.ndarray, chunks: list, index_path: str, chunks_path: str):
    """
    Creates a FAISS vector index (IndexFlatIP for cosine similarity) and saves both
    the index file and chunks metadata pickle file.
    """
    print(f"[4/4] Creating FAISS vector index and saving artifacts...")
    dimension = embeddings.shape[1]  # 384 dimensions for all-MiniLM-L6-v2

    # IndexFlatIP with normalized vectors computes Cosine Similarity
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)

    # Save the FAISS index to disk
    faiss.write_index(index, index_path)
    print(f"      FAISS index saved to: {index_path} (Total Vectors: {index.ntotal})")

    # Save the chunk metadata to disk using pickle
    with open(chunks_path, "wb") as f:
        pickle.dump(chunks, f)
    print(f"      Chunk metadata saved to: {chunks_path}")


def main():
    """Main execution function to build the vector index."""
    print("=" * 70)
    print("  Krishi Mitra AI - Building RAG Vector Index (Layer 2)")
    print("=" * 70)

    # Step 1: Parse scheme data
    chunks = load_and_parse_schemes(DATA_FILE_PATH)

    # Step 2: Generate vector embeddings
    embeddings, _ = generate_embeddings(chunks, EMBEDDING_MODEL_NAME)

    # Step 3: Create and save FAISS index & metadata
    create_and_save_faiss_index(embeddings, chunks, INDEX_OUTPUT_PATH, CHUNKS_OUTPUT_PATH)

    print("=" * 70)
    print(" Indexing Complete! You can now run `python search.py` to test retrieval.")
    print("=" * 70)


if __name__ == "__main__":
    main()
