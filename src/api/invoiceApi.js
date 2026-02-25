import axios from "axios";

// Access token for authentication
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZhaXphbkBpdnlpbnRlcmFjdGl2ZS5jbyIsImNvbXBhbnlfaWQiOm51bGwsInVzZXJfaWQiOjI4MjEsInVzZXJfdHlwZSI6Im1hbmFnZXIiLCJ1c2VyX3R5cGVfaWQiOm51bGwsImVtcHR5cGVfaWQiOjQsImxpY2VuY2VJZCI6MCwiaWF0IjoxNzY5MDU4MjYyLCJleHAiOjg5NjkwNTgyNjJ9.AzmjTkwFYh5NIQ1SSMxdMvAdQlzcREDU9tI2jxAP-k0";

/**
 * Fetches invoice data from the API
 * @param {number} orderId - The order ID to fetch invoice data for
 * @param {string} baseUrl - The base URL for the API
 * @returns {Promise<Object>} The invoice data from the API response
 */
export const fetchInvoiceData = async (orderId = 4678516, baseUrl = "https://targetslive.co/apikt") => {
	try {
		const response = await axios.get(
			`http://localhost:5006/kolsontest/operation/get-order-invoice-data`,
			{
				params: {
					orderId,
					baseurl: baseUrl,
				},
				headers: {
					"x-access-token": ACCESS_TOKEN,
				},
			}
		);

		// Return the first invoice from the response
		if (response.data && response.data.invoices && response.data.invoices.length > 0) {
			return response.data.invoices[0];
		}

		throw new Error("No invoice data found in API response");
	} catch (error) {
		console.error("Error fetching invoice data:", error);
		throw error;
	}
};
