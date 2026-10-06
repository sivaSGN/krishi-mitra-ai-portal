/**
 * =============================================================================
 * Krishi Mitra AI Portal - Chat API Service (chat-service.ts)
 * =============================================================================
 * 
 * This service handles HTTP communication between the React frontend and the
 * FastAPI RAG backend (Layer 4) running at http://localhost:8000.
 */

// API endpoint configuration (configurable via environment variable)
const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8000";

/**
 * Request payload structure sent to FastAPI POST /chat
 */
export interface ChatRequest {
  question: string;
}

/**
 * Response payload structure received from FastAPI POST /chat
 */
export interface ChatResponse {
  answer: string;
}

/**
 * Sends a farmer's question to the FastAPI backend and receives a grounded LLM response.
 * 
 * @param question - The query entered by the farmer
 * @returns Promise resolving to the ChatResponse containing the generated answer
 */
export async function sendFarmerQuestion(question: string): Promise<ChatResponse> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error("Please enter a valid question.");
  }

  const endpoint = `${API_BASE_URL}/chat`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: trimmedQuestion }),
    });

    if (!response.ok) {
      // Try to parse detailed error message from FastAPI HTTPException
      let errorDetail = `Server returned status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          errorDetail = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback to response status text
        errorDetail = response.statusText || errorDetail;
      }
      throw new Error(`Failed to get response from Krishi Mitra AI: ${errorDetail}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error: any) {
    // Check if network error (e.g., backend server not running)
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Cannot connect to Krishi Mitra backend server. Please ensure the FastAPI server is running with 'uvicorn main:app --reload' on http://localhost:8000."
      );
    }
    throw error;
  }
}

/**
 * Checks if the FastAPI backend is online and healthy.
 * 
 * @returns Promise resolving to true if backend is online, false otherwise
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
