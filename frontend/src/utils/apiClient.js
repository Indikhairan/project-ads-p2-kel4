/**
 * API Client Utility
 * Handles:
 * - Automatic auth token addition
 * - Error handling & logging
 * - Request/response formatting
 * - Retry logic (optional)
 */

import API_ENDPOINTS from "./api";

/**
 * Custom error class untuk API errors
 */
export class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Default error handler
 */
const handleAPIError = (error, context = "") => {
  console.error(`❌ API Error [${context}]:`, error);
  
  if (error instanceof APIError) {
    console.error(`   Status: ${error.status}`);
    console.error(`   Details:`, error.details);
  }
  
  throw error;
};

/**
 * Get auth token dari localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem("sapa_ipb_token");
};

/**
 * Main API fetch function dengan error handling
 * 
 * @param {string} url - Full URL atau endpoint
 * @param {object} options - Fetch options (method, body, headers, etc)
 * @param {string} context - Context untuk logging
 * @returns {Promise<object>} Response data
 */
export const apiCall = async (url, options = {}, context = "API Call") => {
  try {
    // Setup headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token jika user sudah login
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Merge options
    const fetchOptions = {
      method: options.method || "GET",
      headers,
      ...options,
    };

    // Remove headers dari body jika ada
    delete fetchOptions.headers;
    fetchOptions.headers = headers;

    console.log(`📤 Fetching ${fetchOptions.method} ${url}`);

    // Execute fetch
    const response = await fetch(url, fetchOptions);

    // Parse response
    const data = await response.json().catch(() => null);

    // Handle errors
    if (!response.ok) {
      const errorMessage = data?.detail || `HTTP ${response.status}`;
      throw new APIError(errorMessage, response.status, data);
    }

    console.log(`✅ Success [${context}]`, data);
    return data;
  } catch (error) {
    handleAPIError(error, context);
  }
};

/**
 * GET request
 */
export const apiGet = async (endpoint, context = "GET") => {
  return apiCall(endpoint, { method: "GET" }, context);
};

/**
 * POST request
 */
export const apiPost = async (endpoint, body = {}, context = "POST") => {
  return apiCall(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  }, context);
};

/**
 * PUT request
 */
export const apiPut = async (endpoint, body = {}, context = "PUT") => {
  return apiCall(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  }, context);
};

/**
 * DELETE request
 */
export const apiDelete = async (endpoint, context = "DELETE") => {
  return apiCall(endpoint, { method: "DELETE" }, context);
};

/**
 * Upload file (multipart/form-data)
 */
export const apiUploadFile = async (endpoint, formData, context = "UPLOAD") => {
  try {
    const headers = {};
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(`📤 Uploading file to ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.detail || `HTTP ${response.status}`;
      throw new APIError(errorMessage, response.status, data);
    }

    console.log(`✅ Upload Success [${context}]`, data);
    return data;
  } catch (error) {
    handleAPIError(error, context);
  }
};

/**
 * Utility: Format API response with error handling
 */
export const handleAPIResponse = (response) => {
  if (response && typeof response === "object") {
    return response;
  }
  throw new Error("Invalid API response format");
};

/**
 * Utility: Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Utility: Clear auth token (logout)
 */
export const clearAuthToken = () => {
  localStorage.removeItem("sapa_ipb_token");
};

export default {
  apiCall,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiUploadFile,
  handleAPIResponse,
  isAuthenticated,
  clearAuthToken,
  APIError,
};
