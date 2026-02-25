import axios from "axios";

const API_BASE_URL = "http://localhost:5006"; // Adjust based on your backend URL

// Access token for authentication
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZhaXphbkBpdnlpbnRlcmFjdGl2ZS5jbyIsImNvbXBhbnlfaWQiOm51bGwsInVzZXJfaWQiOjI4MjEsInVzZXJfdHlwZSI6Im1hbmFnZXIiLCJ1c2VyX3R5cGVfaWQiOm51bGwsImVtcHR5cGVfaWQiOjQsImxpY2VuY2VJZCI6MCwiaWF0IjoxNzY5MDU4MjYyLCJleHAiOjg5NjkwNTgyNjJ9.AzmjTkwFYh5NIQ1SSMxdMvAdQlzcREDU9tI2jxAP-k0";

/**
 * Decodes a JWT token and returns the payload
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if invalid
 */
const decodeJWT = (token) => {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		);
		return JSON.parse(jsonPayload);
	} catch (e) {
		console.error("Failed to decode JWT:", e);
		return null;
	}
};

/**
 * Gets the employee_id (user_id)
 * @returns {number} The employee/user ID
 */
export const getEmployeeId = () => {
	return 2821;
};

// Create axios instance with default headers
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"x-access-token": ACCESS_TOKEN,
		"Content-Type": "application/json",
	},
});

/**
 * Fetches all templates for the current employee
 * @returns {Promise<Array>} Array of template objects
 */
export const fetchTemplates = async () => {
	try {
		const employeeId = getEmployeeId();
		const response = await apiClient.get("/kolsontest/templates", {
			params: employeeId ? { employee_id: employeeId } : {},
		});
		return response.data;
	} catch (error) {
		console.error("Error fetching templates:", error);
		throw error;
	}
};

/**
 * Fetches a single template by ID with mappings and aggregations
 * @param {number} templateId - The template ID
 * @returns {Promise<Object>} Complete template object with mappings and aggregations
 */
export const fetchTemplate = async (templateId) => {
	try {
		const response = await apiClient.get(`/kolsontest/templates/${templateId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching template:", error);
		throw error;
	}
};

/**
 * Creates a new template for the current employee
 * @param {Object} templateData - Template data including name, description, html, template_config, mappings, aggregations
 * @returns {Promise<Object>} Created template object
 */
export const createTemplate = async (templateData) => {
	try {
		const employeeId = getEmployeeId();
		const response = await apiClient.post("/kolsontest/templates", {
			...templateData,
			employee_id: employeeId,
		});
		return response.data;
	} catch (error) {
		console.error("Error creating template:", error);
		throw error;
	}
};

/**
 * Updates an existing template
 * @param {number} templateId - The template ID
 * @param {Object} templateData - Updated template data
 * @returns {Promise<Object>} Updated template object
 */
export const updateTemplate = async (templateId, templateData) => {
	try {
		const response = await apiClient.put(`/kolsontest/templates/${templateId}`, templateData);
		return response.data;
	} catch (error) {
		console.error("Error updating template:", error);
		throw error;
	}
};

/**
 * Deletes a template
 * @param {number} templateId - The template ID
 * @returns {Promise<Object>} Success confirmation
 */
export const deleteTemplate = async (templateId) => {
	try {
		const response = await apiClient.delete(`/kolsontest/templates/${templateId}`);
		return response.data;
	} catch (error) {
		console.error("Error deleting template:", error);
		throw error;
	}
};

/**
 * Sets a template as default for the current employee
 * @param {number} templateId - The template ID
 * @returns {Promise<Object>} Updated template object
 */
export const setDefaultTemplate = async (templateId) => {
	try {
		const employeeId = getEmployeeId();
		const response = await apiClient.post(`/kolsontest/templates/${templateId}/set-default`, {
			employee_id: employeeId,
		});
		return response.data;
	} catch (error) {
		console.error("Error setting default template:", error);
		throw error;
	}
};
