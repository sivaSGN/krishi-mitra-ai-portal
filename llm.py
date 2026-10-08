"""
=============================================================================
Krishi Mitra AI Portal - Layer 3: LLM Integration (llm.py)
=============================================================================

This module connects Layer 2 (FAISS Vector Similarity Search) with Layer 3
(Groq Large Language Model) to provide grounded, hallucination-free,
and farmer-friendly answers about Indian Agricultural Schemes.

Pipeline Flow:
Farmer Question ──> FAISS Retrieval (Top 3 Schemes) ──> Context Augmentation 
               ──> Groq LLM (Strict Guardrails) ──> Natural Language Answer
=============================================================================
"""

import os
import sys
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from groq import Groq

# Import the Layer 2 FAISS retriever from search.py
from search import SchemeRetriever

# Set terminal stdout encoding to UTF-8 on Windows to avoid UnicodeEncodeError
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# 1. Environment & Configuration Setup
# ---------------------------------------------------------------------------
# Load environment variables from .env file
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Supported and tested Groq models
DEFAULT_MODEL = "openai/gpt-oss-120b"
FALLBACK_MODELS = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b"]

# Standard fallback message when no relevant scheme information is found
STANDARD_FALLBACK_MESSAGE = (
    "I apologize, but I could not find relevant government agricultural schemes in our database "
    "matching your specific request. Please contact your nearest Krishi Bhavan, Rythu Bharosa Kendram (RBK), "
    "or District Agricultural Extension Officer for personalized guidance."
)


# ---------------------------------------------------------------------------
# 2. Layer 3: Krishi Mitra LLM Generator Class
# ---------------------------------------------------------------------------
class KrishiMitraLLM:
    """
    RAG Generation Engine integrating FAISS retrieval with Groq LLM.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = DEFAULT_MODEL,
        retriever: Optional[SchemeRetriever] = None,
    ):
        """
        Initializes the Groq client and the FAISS SchemeRetriever.

        Args:
            api_key (str, optional): Groq API key. If not provided, reads from .env.
            model_name (str): Groq model identifier to use for text generation.
            retriever (SchemeRetriever, optional): Pre-existing retriever instance.
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError(
                "GROQ_API_KEY not found! Please add your GROQ_API_KEY to the .env file."
            )

        print("[*] Initializing Groq LLM client...")
        self.client = Groq(api_key=self.api_key)
        self.model_name = model_name

        print("[*] Initializing FAISS Vector Retriever (Layer 2)...")
        self.retriever = retriever if retriever is not None else SchemeRetriever()
        print("[*] Krishi Mitra LLM Layer 3 is fully initialized and ready!\n")

    def build_prompt_messages(self, query: str, retrieved_schemes: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Constructs a structured prompt with system guardrails and retrieved context.

        Args:
            query (str): The farmer's question.
            retrieved_schemes (list): Schemes retrieved from FAISS.

        Returns:
            list: List of message dictionaries formatted for Groq Chat Completion.
        """
        # Format the retrieved schemes into clean text context
        if retrieved_schemes:
            context_blocks = []
            for i, scheme in enumerate(retrieved_schemes, start=1):
                block = f"--- SCHEME CONTEXT #{i} (Score: {scheme.get('similarity_score', 0):.4f}) ---\n"
                block += scheme.get("content", "").strip()
                context_blocks.append(block)
            schemes_context = "\n\n".join(context_blocks)
        else:
            schemes_context = "No relevant schemes found in the database."

        # System message with strict anti-hallucination and formatting guardrails
        system_prompt = (
            "You are 'Krishi Mitra AI' (कृषि मित्र), an empathetic, polite, and knowledgeable "
            "agricultural assistant dedicated to helping Indian farmers understand and access government schemes.\n\n"
            "### STRICT OPERATIONAL GUIDELINES:\n"
            "1. GROUNDED TRUTH ONLY: Answer the farmer's question using ONLY the factual information "
            "provided in the 'AGRICULTURAL SCHEMES CONTEXT' below. Do NOT fabricate or assume any scheme names, "
            "subsidy amounts, eligibility requirements, contact numbers, or deadlines.\n"
            "2. ANTI-HALLUCINATION & FALLBACK RULE: If the provided context DOES NOT contain information "
            "relevant to answering the farmer's query, or if the user asks something completely unrelated to farming "
            "or the indexed schemes, you MUST politely respond with:\n"
            f"   \"{STANDARD_FALLBACK_MESSAGE}\"\n"
            "3. FARMER-FRIENDLY TONE: Use clear, simple, respectful language without overly dense bureaucratic jargon.\n"
            "4. STRUCTURE YOUR RESPONSE clearly into readable sections:\n"
            "   - 🌾 **Overview & Best Matched Scheme(s)**\n"
            "   - 💰 **Benefits & Assistance Offered**\n"
            "   - 📋 **Eligibility Criteria**\n"
            "   - 📄 **Required Documents**\n"
            "   - 🔗 **Where to Apply / Official Resource** (include the link if available in the context)\n"
            "5. If multiple schemes match, briefly mention the alternative options so the farmer has complete choices."
        )

        # User message containing both the retrieved context and farmer query
        user_prompt = (
            f"AGRICULTURAL SCHEMES CONTEXT:\n"
            f"====================================================\n"
            f"{schemes_context}\n"
            f"====================================================\n\n"
            f"FARMER QUESTION: \"{query}\"\n\n"
            f"Please provide a helpful, structured, and accurate response based strictly on the context above."
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    def ask(self, query: str, top_k: int = 3, temperature: float = 0.2) -> Dict[str, Any]:
        """
        End-to-end RAG answering pipeline:
        1. Query -> FAISS Retrieval (Top K schemes)
        2. Format context and prompt
        3. Groq LLM Generation
        4. Return clean answer and metadata

        Args:
            query (str): The farmer's question.
            top_k (int): Number of schemes to retrieve from FAISS (default: 3).
            temperature (float): Sampling temperature (low value for deterministic, factual outputs).

        Returns:
            dict: Structured response with query, answer, retrieved schemes, and model used.
        """
        query_clean = query.strip() if query else ""
        if not query_clean:
            return {
                "query": query,
                "answer": "Please ask a question about agricultural schemes or farming assistance.",
                "retrieved_schemes": [],
                "model_used": self.model_name,
            }

        # Step 1: Retrieve top matching schemes from FAISS
        retrieved_schemes = self.retriever.search(query_clean, top_k=top_k)

        # Step 2: Build the prompt with strict context constraints
        messages = self.build_prompt_messages(query_clean, retrieved_schemes)

        # Step 3: Call Groq API with fallback model handling
        models_to_try = [self.model_name] + [m for m in FALLBACK_MODELS if m != self.model_name]
        response_text = None
        last_error = None
        model_used = self.model_name

        for model in models_to_try:
            try:
                chat_completion = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=1024,
                )
                response_text = chat_completion.choices[0].message.content
                model_used = model
                break
            except Exception as e:
                last_error = e
                print(f"[!] Warning: Model '{model}' failed: {e}. Trying fallback if available...")

        if response_text is None:
            raise RuntimeError(f"Failed to generate response with Groq API. Error: {last_error}")

        return {
            "query": query_clean,
            "answer": response_text,
            "retrieved_schemes": retrieved_schemes,
            "model_used": model_used,
        }


# ---------------------------------------------------------------------------
# 3. Helper Output Formatter
# ---------------------------------------------------------------------------
def print_krishi_response(result: Dict[str, Any]):
    """
    Neatly prints the complete question-to-answer RAG flow in the terminal.
    """
    print("\n" + "=" * 80)
    print(f" 🌾 FARMER QUESTION: {result['query']}")
    print("=" * 80)

    print("\n[Layer 2: FAISS Retrieved Schemes]")
    for i, scheme in enumerate(result["retrieved_schemes"], start=1):
        print(f"  {i}. {scheme['scheme_name']} (Similarity Score: {scheme['similarity_score']:.4f})")

    print("\n" + "-" * 80)
    print(f"[Layer 3: Krishi Mitra AI Response (Model: {result['model_used']})]")
    print("-" * 80)
    print(result["answer"])
    print("=" * 80 + "\n")


# ---------------------------------------------------------------------------
# 4. Main Demonstration & Interactive Execution
# ---------------------------------------------------------------------------
def main():
    """
    Demonstrates Layer 3 RAG generation on key agricultural queries.
    """
    print("=" * 80)
    print("   KRISHI MITRA AI PORTAL - LAYER 3 (RAG + GROQ LLM INTEGRATION)")
    print("=" * 80)

    # Initialize the LLM system
    try:
        krishi_ai = KrishiMitraLLM()
    except Exception as e:
        print(f"[X] Initialization Error: {e}")
        sys.exit(1)

    # Test Suite of representative farmer questions
    test_queries = [
        # Query 1: Paddy crop assistance
        "how much amount can PM-KISAN offer",
        # Query 2: Crop damage / disaster compensation
        "My crops were damaged by heavy rain and flood, how to get compensation?",
        # Query 3: Drip irrigation subsidy
        "Subsidy for micro drip irrigation systems",
        # Query 4: Hallucination / Out-of-domain test
        "How can I get a government loan to buy a sports car?",
    ]

    print("[*] Running automated test queries to verify RAG generation...\n")
    for query in test_queries:
        result = krishi_ai.ask(query, top_k=3)
        print_krishi_response(result)

    print("\n[*] All automated tests completed successfully!")
    print("[*] You can now import KrishiMitraLLM into your web app or API service.")


if __name__ == "__main__":
    main()
