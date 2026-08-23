import axios from "axios";

// Shared HTTP client for frontend requests to the OrbitPM API.
export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:1800/api",
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

let refreshRequest = null;

// Refreshes the session once when several requests fail at the same time.
function refreshSession() {
	if (!refreshRequest) {
		refreshRequest = api
			.request({
				method: "POST",
				url: "/auth/refresh-token",
				skipAuthRefresh: true,
			})
			.finally(() => {
				refreshRequest = null;
			});
	}

	return refreshRequest;
}

function redirectToAuth() {
	localStorage.removeItem("user");
	window.location.assign("/auth");
}

// Retries an expired request once, then sends the user to authentication.
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		const isUnauthorized = error.response?.status === 401;
		const isRefreshRequest = originalRequest?.skipAuthRefresh;

		if (isRefreshRequest) {
			redirectToAuth();
			return Promise.reject(error);
		}

		if (!isUnauthorized || !originalRequest || originalRequest._retry) {
			return Promise.reject(error);
		}

		originalRequest._retry = true;

		try {
			await refreshSession();
			return api.request(originalRequest);
		} catch (refreshError) {
			redirectToAuth();
			return Promise.reject(refreshError);
		}
	},
);

// Converts Axios and network failures into one predictable error shape.
export function handleApiError(error) {
	if (error?.isApiError) return error;

	const message =
		error.response?.data?.message ||
		error.data?.message ||
		error.message ||
		"Something went wrong";

	const apiError = new Error(message);
	apiError.status = error.response?.status || error.status || 0;
	apiError.data = error.response?.data || error.data || null;
	apiError.isApiError = true;

	return apiError;
}

// Sends a request and applies the shared error handling to every API call.
export async function request(method, url, options = {}) {
	try {
		const response = await api.request({
			...options,
			method,
			url,
		});

		return response.data;
	} catch (error) {
		throw handleApiError(error);
	}
}

// Common HTTP method helpers for feature-specific API services.
export const get = (url, config = {}) => request("GET", url, config);
export const post = (url, data = {}, config = {}) =>
	request("POST", url, { ...config, data });
export const put = (url, data = {}, config = {}) =>
	request("PUT", url, { ...config, data });
export const patch = (url, data = {}, config = {}) =>
	request("PATCH", url, { ...config, data });
export const del = (url, config = {}) => request("DELETE", url, config);

