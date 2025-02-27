/**
 * Common API utilities and error handling for LLM services
 */

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, provider, statusCode, details = null) {
    super(message);
    this.name = 'ApiError';
    this.provider = provider;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Validate API response
 * @param {Response} response - Fetch Response object
 * @param {string} provider - Provider name
 * @returns {Promise<object>} Parsed response data
 * @throws {ApiError} If response is not ok
 */
export async function validateApiResponse(response, provider) {
  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      errorDetails = { message: response.statusText };
    }

    throw new ApiError(
      errorDetails.error?.message || 'API request failed',
      provider,
      response.status,
      errorDetails
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError(
      'Invalid JSON response',
      provider,
      response.status,
      { originalError: error.message }
    );
  }
}

/**
 * Format error message for display
 * @param {Error} error - Error object
 * @returns {string} Formatted error message
 */
export function formatErrorMessage(error) {
  if (error instanceof ApiError) {
    return `${error.provider} API Error (${error.statusCode}): ${error.message}`;
  }
  return error.message || 'An unknown error occurred';
}

/**
 * Retry a failed API call
 * @param {Function} apiCall - API call function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise<any>} API call result
 */
export async function retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error instanceof ApiError && error.statusCode === 401) {
        throw error;
      }
      
      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Check if error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(error) {
  if (error instanceof ApiError) {
    // Retry on rate limits and server errors
    return error.statusCode === 429 || error.statusCode >= 500;
  }
  // Retry on network errors
  return error.name === 'TypeError' || error.name === 'NetworkError';
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @param {string} provider - Provider name
 * @returns {boolean} Whether the API key format is valid
 */
export function validateApiKey(apiKey, provider) {
  if (!apiKey?.trim()) return false;
  
  const patterns = {
    openai: /^sk-[a-zA-Z0-9]{32,}$/,
    gemini: /^AI[a-zA-Z0-9_-]{20,}$/,
    claude: /^sk-ant-[a-zA-Z0-9+/=-]{40,}$/
  };

  return patterns[provider]?.test(apiKey) ?? false;
}

/**
 * Parse error details from API response
 * @param {object} error - Error response from API
 * @param {string} provider - Provider name
 * @returns {object} Parsed error details
 */
export function parseErrorDetails(error, provider) {
  const parsers = {
    openai: (e) => ({
      message: e.error?.message,
      code: e.error?.code,
      type: e.error?.type
    }),
    gemini: (e) => ({
      message: e.error?.message,
      status: e.error?.status,
      details: e.error?.details
    }),
    claude: (e) => ({
      message: e.error?.message,
      type: e.error?.type,
      details: e.error?.details
    })
  };

  return parsers[provider]?.(error) || { message: error.message || 'Unknown error' };
}