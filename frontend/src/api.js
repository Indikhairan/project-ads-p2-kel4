export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiFetch = (path, opts = {}) => {
	const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
	return fetch(url, opts);
};
