"""
=============================================================================
Krishi Mitra AI Portal - Layer 2: RAG Vector Similarity Search (search.py)
=============================================================================

This script loads the pre-built FAISS vector index (scheme_index.faiss) and
metadata (chunks.pkl), accepts a farmer query, encodes it into a dense vector
using Hugging Face's intfloat/multilingual-e5-small, and performs similarity
search to retrieve the top matching agricultural schemes.

Prefix conventions for E5 models:
- Every query must be prefixed with 'query: ' before generating its embedding.
=============================================================================
"""

import os
import sys
import pickle
import logging

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

# Set terminal stdout encoding to UTF-8 on Windows to avoid UnicodeEncodeError
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

logger = logging.getLogger("krishi-mitra-retriever")

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------
INDEX_FILE_PATH = os.getenv("INDEX_FILE_PATH", "scheme_index.faiss")
CHUNKS_FILE_PATH = os.getenv("CHUNKS_FILE_PATH", "chunks.pkl")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "intfloat/multilingual-e5-small")


class SchemeRetriever:
    """
    RAG Retrieval Engine for Krishi Mitra Agricultural Schemes
    using multilingual-e5-small embeddings and FAISS similarity search.
    """

    def __init__(
        self,
        index_path: str = INDEX_FILE_PATH,
        chunks_path: str = CHUNKS_FILE_PATH,
        model_name: str = EMBEDDING_MODEL_NAME,
    ):
        """
        Initializes the retriever by loading the embedding model, FAISS index, and chunks.
        Performs validation for missing files, model loading, and dimension compatibility.
        """
        if not os.path.exists(index_path):
            raise FileNotFoundError(
                f"FAISS index file not found at '{index_path}'! "
                f"Please build the index first by running: python create_index.py"
            )
        if not os.path.exists(chunks_path):
            raise FileNotFoundError(
                f"Chunks metadata file not found at '{chunks_path}'! "
                f"Please build the index and metadata first by running: python create_index.py"
            )

        print(f"[*] Loading embedding model '{model_name}'...")
        try:
            self.model = SentenceTransformer(model_name)
        except Exception as e:
            raise RuntimeError(
                f"Failed to load or download embedding model '{model_name}'. "
                f"Please check your internet connection or Hugging Face model cache. "
                f"Underlying error: {e}"
            ) from e

        # Determine model embedding dimension
        if hasattr(self.model, "get_embedding_dimension"):
            self.embedding_dimension = self.model.get_embedding_dimension()
        elif hasattr(self.model, "get_sentence_embedding_dimension"):
            self.embedding_dimension = self.model.get_sentence_embedding_dimension()
        else:
            self.embedding_dimension = 384

        print(f"[*] Loading FAISS vector index from '{index_path}'...")
        try:
            self.index = faiss.read_index(index_path)
        except Exception as e:
            raise RuntimeError(
                f"Failed to read FAISS index from '{index_path}'. "
                f"File might be corrupted. Please run 'python create_index.py' to rebuild. Error: {e}"
            ) from e

        # Validate index dimension matches embedding model dimension
        if self.index.d != self.embedding_dimension:
            raise ValueError(
                f"Incompatible FAISS index dimension! Index dimension is {self.index.d}, "
                f"but model '{model_name}' produces {self.embedding_dimension} dimensions. "
                f"The index was built with a different model. "
                f"Please rebuild the index using: python create_index.py"
            )

        print(f"[*] Loading chunk metadata from '{chunks_path}'...")
        try:
            with open(chunks_path, "rb") as f:
                self.chunks = pickle.load(f)
        except Exception as e:
            raise RuntimeError(
                f"Failed to load chunk metadata from '{chunks_path}'. Error: {e}"
            ) from e

        if self.index.ntotal != len(self.chunks):
            print(
                f"[!] Warning: FAISS index count ({self.index.ntotal}) does not match "
                f"metadata chunk count ({len(self.chunks)}). Consider rebuilding the index."
            )

        print(
            f"[*] Retriever ready with {len(self.chunks)} schemes indexed! "
            f"(Dimension: {self.embedding_dimension}, Model: {model_name})\n"
        )

    def search(self, query: str, top_k: int = 3):
        """
        Performs vector similarity search for a farmer query.
        Prefixes the query with 'query: ' before generating its embedding.

        Args:
            query (str): The question or problem statement entered by the farmer.
            top_k (int): Number of most relevant schemes to return (default: 3).

        Returns:
            list of dict: Top matching schemes with rank, scheme_name, similarity_score, and content.
        """
        if not query or not query.strip():
            return []

        query_clean = query.strip()
        # Prefix every query with 'query: ' as required by intfloat/multilingual-e5-small
        formatted_query = query_clean if query_clean.startswith("query: ") else f"query: {query_clean}"

        # 1. Encode query into dense vector embedding
        query_embedding = self.model.encode([formatted_query], convert_to_numpy=True)
        query_embedding = np.array(query_embedding, dtype=np.float32)

        # 2. Normalize vector for Cosine Similarity
        faiss.normalize_L2(query_embedding)

        # 3. Search top_k nearest neighbors in FAISS index
        scores, indices = self.index.search(query_embedding, top_k)

        # 4. Format and collect results preserving original scheme metadata
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
        content_preview = item["content"]
        if len(content_preview) > 500:
            content_preview = content_preview[:500] + "\n... [content truncated for preview]"
        print(content_preview)
        print("-" * 80)
    print("\n")


def main():
    """
    Test demonstration for RAG retrieval layer supporting English, Tamil, and Telugu.
    """
    retriever = SchemeRetriever()

    # Multilingual Test Queries: English, Tamil, Telugu
    test_queries = [
        # English queries
        ("English", "I want a scheme for paddy crop"),
        ("English", "My crops were damaged by heavy rain and flood, how to get compensation?"),
        ("English", "Subsidy for micro drip irrigation systems"),
        # Tamil queries
        ("Tamil", "நெல் பயிருக்கான அரசு திட்டம் மற்றும் மானியம் என்ன?"),
        ("Tamil", "மழை மற்றும் வெள்ளத்தால் பயிர் சேதம் அடைந்தால் நஷ்டஈடு பெறுவது எப்படி?"),
        # Telugu queries
        ("Telugu", "వరి పంటకు ప్రభుత్వ పథకాలు మరియు ఆర్థిక సహాయం ఏమిటి?"),
        ("Telugu", "వర్షాలు మరియు వరదల వల్ల పంట నష్టపోతే పరిహారం ఎలా పొందాలి?"),
    ]

    for lang, query in test_queries:
        print(f"[{lang} Test Query]")
        results = retriever.search(query, top_k=3)
        print_search_results(query, results)


if __name__ == "__main__":
    main()