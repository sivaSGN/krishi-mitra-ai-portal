"""
=============================================================================
Krishi Mitra AI Portal - Layer 2: RAG Vector Similarity Search (search.py)
=============================================================================

This script loads the pre-built FAISS vector index (scheme_index.faiss) and
metadata (chunks.pkl), accepts a farmer query, encodes it into a dense vector,
and performs similarity search to retrieve the top matching agricultural schemes.
"""

import os
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------
INDEX_FILE_PATH = "scheme_index.faiss"
CHUNKS_FILE_PATH = "chunks.pkl"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class SchemeRetriever:
    """
    RAG Retrieval Engine for Krishi Mitra Agricultural Schemes.
    """

    def __init__(self, index_path: str = INDEX_FILE_PATH, chunks_path: str = CHUNKS_FILE_PATH, model_name: str = EMBEDDING_MODEL_NAME):
        """
        Initializes the retriever by loading the embedding model, FAISS index, and chunks.
        """
        if not os.path.exists(index_path):
            raise FileNotFoundError(
                f"FAISS index '{index_path}' not found! Please run 'python create_index.py' first."
            )
        if not os.path.exists(chunks_path):
            raise FileNotFoundError(
                f"Chunks file '{chunks_path}' not found! Please run 'python create_index.py' first."
            )

        print("[*] Loading embedding model...")
        self.model = SentenceTransformer(model_name)

        print("[*] Loading FAISS vector index...")
        self.index = faiss.read_index(index_path)

        print("[*] Loading chunk metadata...")
        with open(chunks_path, "rb") as f:
            self.chunks = pickle.load(f)

        print(f"[*] Retriever ready with {len(self.chunks)} schemes indexed!\n")

    def search(self, query: str, top_k: int = 3):
        """
        Performs vector similarity search for a farmer query.

        Args:
            query (str): The question or problem statement entered by the farmer.
            top_k (int): Number of most relevant schemes to return (default: 3).

        Returns:
            list of dict: Top matching schemes with scheme_name, similarity_score, and content.
        """
        if not query or not query.strip():
            return []

        # 1. Encode query into dense vector embedding
        query_embedding = self.model.encode([query], convert_to_numpy=True).astype("float32")

        # 2. Normalize vector for Cosine Similarity
        faiss.normalize_L2(query_embedding)

        # 3. Search top_k nearest neighbors in FAISS index
        scores, indices = self.index.search(query_embedding, top_k)

        # 4. Format and collect results
        results = []
        for rank, (idx, score) in enumerate(zip(indices[0], scores[0]), start=1):
            if idx < 0 or idx >= len(self.chunks):
                continue

            chunk = self.chunks[idx]
            results.append({
                "rank": rank,
                "scheme_name": chunk.get("scheme_name", "Unknown Scheme"),
                "similarity_score": float(score),
                "content": chunk.get("content", "")
            })

        return results


def print_search_results(query: str, results: list):
    """
    Helper function to cleanly display retrieved search results in terminal.
    """
    print("=" * 80)
    print(f" Farmer Query: \"{query}\"")
    print("=" * 80)

    if not results:
        print("No matching schemes found.\n")
        return

    for item in results:
        print(f"\n[Rank {item['rank']}] Scheme: {item['scheme_name']}")
        print(f"Similarity Score: {item['similarity_score']:.4f}")
        print("-" * 80)
        print(item["content"])
        print("-" * 80)
    print("\n")


def main():
    """
    Test demonstration for RAG retrieval layer.
    """
    retriever = SchemeRetriever()

    # Test Query 1: As required by the user
    test_query = "I want a scheme for paddy crop"
    results = retriever.search(test_query, top_k=3)
    print_search_results(test_query, results)

    # Test Query 2: Crop insurance
    test_query_2 = "My crops were damaged by heavy rain and flood, how to get compensation?"
    results_2 = retriever.search(test_query_2, top_k=3)
    print_search_results(test_query_2, results_2)

    # Test Query 3: Drip irrigation
    test_query_3 = "Subsidy for micro drip irrigation systems"
    results_3 = retriever.search(test_query_3, top_k=3)
    print_search_results(test_query_3, results_3)


if __name__ == "__main__":
    main()
##https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2