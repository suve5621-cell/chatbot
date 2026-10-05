/**
 * Maps system and Ollama errors to short, friendly messages without stack traces.
 */
export function formatFriendlyError(error) {
  const message = error?.message || '';
  const status = error?.status || error?.statusCode || 500;

  // Ollama service down / not running
  if (
    /ollama is not running|econnrefused|failed to fetch|unable to reach|network error|connect/i.test(message) ||
    status === 503
  ) {
    return {
      status: 503,
      error:
        "Ollama is not running. Please start Ollama on your computer (run 'ollama serve' or open the Ollama app)."
    };
  }

  // Model not found or not pulled yet
  if (/model.*not installed|model.*not found|model.*unavailable/i.test(message) || status === 404) {
    return {
      status: 404,
      error: message || "The requested model is unavailable in Ollama. Please download it using 'ollama pull <model>'."
    };
  }

  // Empty or invalid input
  if (/empty/i.test(message) || status === 400) {
    return {
      status: 400,
      error: 'Message cannot be empty.'
    };
  }

  // Fallback friendly error
  return {
    status: status >= 400 && status < 600 ? status : 500,
    error: message || 'An unexpected error occurred. Please check your local Ollama server.'
  };
}
