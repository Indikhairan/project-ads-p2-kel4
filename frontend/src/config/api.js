/**
 * API Configuration & Endpoints
 * Centralized API URL management untuk menghindari hardcoding di setiap component
 */

// Base URL dari backend
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
};

/**
 * Semua API endpoints dalam satu tempat
 * Jika backend berubah struktur, hanya perlu update di sini
 */
export const API_ENDPOINTS = {
  // ─── Authentication ──────────────────────────────────────────
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
  },

  // ─── Users & Profile ─────────────────────────────────────────
  USERS: {
    LIST: `${API_BASE_URL}/api/v1/users`,
    ME: `${API_BASE_URL}/api/v1/users/me`,
    DETAIL: (id) => `${API_BASE_URL}/api/v1/users/${id}`,
    CREATE: `${API_BASE_URL}/api/v1/users`,
    UPDATE: (id) => `${API_BASE_URL}/api/v1/users/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/v1/users/${id}`,
  },

  // ─── Tickets (Tiket Layanan) ─────────────────────────────────
  TICKETS: {
    LIST: `${API_BASE_URL}/api/v1/tiket`,
    CREATE: `${API_BASE_URL}/api/v1/tiket`,
    DETAIL: (id) => `${API_BASE_URL}/api/v1/tiket/${encodeURIComponent(id)}`,
    UPDATE: (id) => `${API_BASE_URL}/api/v1/tiket/${encodeURIComponent(id)}`,
    VERIFY: (id) => `${API_BASE_URL}/api/v1/tiket/${encodeURIComponent(id)}/verifikasi`,
    RESPONSE: (id) => `${API_BASE_URL}/api/v1/tiket/${encodeURIComponent(id)}/tanggapan`,
  },

  // ─── Staff Operations ────────────────────────────────────────
  STAFF: {
    GENERATE_KEY: `${API_BASE_URL}/api/v1/staff/generate-key`,
    CHECK_KEY_STATUS: `${API_BASE_URL}/api/v1/staff/status-kunci`,
    GET_TICKET_RESPONSE: (id) => `${API_BASE_URL}/api/v1/tiket/${encodeURIComponent(id)}/tanggapan`,
  },

  // ─── Notifications ───────────────────────────────────────────
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/notifikasi`,
    READ_ALL: `${API_BASE_URL}/notifikasi/read-all`,
    READ_ONE: (id) => `${API_BASE_URL}/notifikasi/${encodeURIComponent(id)}/read`,
  },

  // ─── Chatbot ─────────────────────────────────────────────────
  CHATBOT: {
    ASK: `${API_BASE_URL}/api/v1/chatbot/tanya`,
    HISTORY: `${API_BASE_URL}/api/v1/chatbot/riwayat`,
  },

  // ─── Knowledge Base ──────────────────────────────────────────
  KNOWLEDGE_BASE: {
    LIST: `${API_BASE_URL}/api/v1/knowledge-base`,
    CREATE: `${API_BASE_URL}/api/v1/knowledge-base`,
    DETAIL: (id) => `${API_BASE_URL}/api/v1/knowledge-base/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/api/v1/knowledge-base/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/v1/knowledge-base/${id}`,
  },

  // ─── Admin - Security Dashboard ──────────────────────────────
  ADMIN_SECURITY: {
    STATS: `${API_BASE_URL}/api/v1/admin/security/stats`,
    LOGS: (page = 1, limit = 50) => `${API_BASE_URL}/api/v1/admin/security/logs?page=${page}&limit=${limit}`,
  },

  // ─── Admin - Sync ────────────────────────────────────────────
  ADMIN_SYNC: {
    DASHBOARD: `${API_BASE_URL}/api/v1/admin/sync`,
    APPROVE: (id) => `${API_BASE_URL}/api/v1/admin/sync/${id}/approve`,
    REJECT: (id) => `${API_BASE_URL}/api/v1/admin/sync/${id}/reject`,
  },

  // ─── Files (Upload/Download) ────────────────────────────────
  FILES: {
    UPLOAD: `${API_BASE_URL}/files/upload`,
    DOWNLOAD: (fileId) => `${API_BASE_URL}/files/${fileId}`,
  },
};

export default API_ENDPOINTS;
