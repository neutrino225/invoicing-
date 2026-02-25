/**
 * Gets a value from an object using a dot-notation path
 * @param {Object} obj - The object to traverse
 * @param {string} path - Dot-notation path (e.g., "distributor.name")
 * @returns {*} The value at the path, or undefined
 */
const getNestedValue = (obj, path) => {
	if (!path || !obj) return undefined;
	const keys = path.split(".");
	let value = obj;
	for (const key of keys) {
		if (value === null || value === undefined) return undefined;
		value = value[key];
	}
	return value;
};

/**
 * Calculates total discount from discount object
 * @param {Object} discounts - Discount object with firstDisc, secondDisc, thirdDisc, fourthDisc
 * @returns {number} Sum of all discounts
 */
const calculateTotalDiscount = (discounts) => {
	if (!discounts) return 0;
	return (
		(discounts.firstDisc || 0) +
		(discounts.secondDisc || 0) +
		(discounts.thirdDisc || 0) +
		(discounts.fourthDisc || 0)
	);
};

/**
 * Formats a date string to YYYY-MM-DD format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date in YYYY-MM-DD format
 */
const formatDate = (dateString) => {
	if (!dateString) return "";

	try {
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
			return dateString;
		}
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return "";
		}
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	} catch (error) {
		return "";
	}
};

/**
 * Transforms API data to template data structure using mappings
 * @param {Object} apiData - The API response data
 * @param {Array} mappings - Array of mapping objects from template_mappings table
 * @param {Array} aggregations - Array of aggregation objects from template_aggregations table
 * @returns {Object} Transformed data structure matching template placeholders
 */
export const transformApiDataToTemplate = (apiData, mappings = [], aggregations = []) => {
	if (!apiData) {
		throw new Error("API data is required");
	}

	// Group mappings by section
	const mappingsBySection = {
		header: mappings.filter((m) => m.section === "header"),
		lineItems: mappings.filter((m) => m.section === "lineItems"),
		summary: mappings.filter((m) => m.section === "summary"),
		notes: mappings.filter((m) => m.section === "notes"),
	};

	// Transform header
	const header = {};
	mappingsBySection.header.forEach((mapping) => {
		const apiValue = getNestedValue(apiData, mapping.api_field_path);
		if (mapping.template_field === "invoiceNo") {
			header[mapping.template_field] = String(apiValue || "");
		} else if (
			mapping.template_field === "bookingDate" ||
			mapping.template_field === "deliveryDate"
		) {
			header[mapping.template_field] = formatDate(apiValue);
		} else {
			header[mapping.template_field] = apiValue || "";
		}
	});

	// Transform line items
	const lineItems = (apiData.items || []).map((item, index) => {
		const lineItem = {
			_index: index + 1, // Add 1-based index for Mustache template
		};
		
		// Create a map of template_field -> mapping for quick lookup
		const mappingMap = new Map();
		mappingsBySection.lineItems.forEach((mapping) => {
			mappingMap.set(mapping.template_field, mapping);
		});
		
		// Process all mappings to populate fields
		mappingMap.forEach((mapping, templateField) => {
			const apiValue = getNestedValue(item, mapping.api_field_path);

			if (templateField === "sku") {
				lineItem[templateField] = apiValue || "";
			} else if (templateField === "ctSize") {
				lineItem[templateField] = String(apiValue || "");
			} else if (templateField === "barcode") {
				lineItem[templateField] = apiValue || "";
			} else if (templateField === "hsCode") {
				lineItem[templateField] = apiValue || "";
			} else if (["firstDisc", "secondDisc", "thirdDisc", "fourthDisc"].includes(templateField)) {
				// Map individual discount field directly
				const discounts = item.pricing?.discounts || {};
				lineItem[templateField] = discounts[templateField] || 0;
			} else if (templateField === "grossValue") {
				// Calculate grossValue: netValue - advanceTax - gst
				const netValue = item.pricing?.netValue || 0;
				const advanceTax = item.pricing?.advanceTax || 0;
				const gstValue = item.pricing?.gst?.value || 0;
				lineItem[templateField] = netValue - advanceTax - gstValue;
			} else if (templateField === "others") {
				lineItem[templateField] = item.pricing?.gst?.value || 0;
			} else if (templateField === "gstPercent") {
				lineItem[templateField] = item.pricing?.gst?.percent || 0;
			} else if (templateField === "gst") {
				// Map GST value from pricing.gst.value
				lineItem[templateField] = item.pricing?.gst?.value || 0;
			} else if (templateField === "advanceTax") {
				// Map advance tax from pricing.advanceTax
				lineItem[templateField] = item.pricing?.advanceTax || 0;
			} else {
				// For numeric fields, default to 0; for text fields, default to empty string
				const numericFields = ["ctn", "pcs", "rp", "tp", "tpVal", "netValue"];
				if (numericFields.includes(templateField)) {
					lineItem[templateField] = typeof apiValue === "number" ? apiValue : (parseFloat(apiValue) || 0);
				} else {
					lineItem[templateField] = apiValue || "";
				}
			}
		});

		// Always populate gst, advanceTax, and discount fields for aggregations, even if not in mappings
		// This ensures aggregations can calculate correctly
		if (!mappingMap.has("gst")) {
			lineItem["gst"] = item.pricing?.gst?.value || 0;
		}
		if (!mappingMap.has("advanceTax")) {
			lineItem["advanceTax"] = item.pricing?.advanceTax || 0;
		}
		const discountsForAgg = item.pricing?.discounts || {};
		["firstDisc", "secondDisc", "thirdDisc", "fourthDisc"].forEach((discField) => {
			if (!mappingMap.has(discField)) {
				lineItem[discField] = discountsForAgg[discField] || 0;
			}
		});

		// Apply aggregations
		aggregations.forEach((agg) => {
			if (agg.fields && Array.isArray(agg.fields)) {
				const aggregatedValue = agg.fields.reduce((sum, fieldId) => {
					const value = lineItem[fieldId];
					const numValue = typeof value === "number" ? value : 0;
					// Debug: Log aggregation calculation
					if (index === 0) {
						console.log(`[Data Transformer] Aggregation ${agg.id || agg.aggregation_id}: ${fieldId} = ${value} (${numValue})`);
					}
					return sum + numValue;
				}, 0);
				// Use id from template config (this is what's in the HTML template and lineItems array)
				// The id field is what's stored in template_config.lineItems
				const aggId = agg.id || agg.aggregation_id;
				if (aggId) {
					lineItem[aggId] = aggregatedValue;
					// Debug: Log final aggregation value
					if (index === 0) {
						console.log(`[Data Transformer] Set ${aggId} = ${aggregatedValue}`);
					}
				}
				// Also set aggregation_id if different from id (for backward compatibility)
				if (agg.aggregation_id && agg.aggregation_id !== aggId) {
					lineItem[agg.aggregation_id] = aggregatedValue;
				}
			}
		});

		return lineItem;
	});

	// Transform summary
	const summary = {};
	mappingsBySection.summary.forEach((mapping) => {
		// Remove "totals." prefix if present
		const fieldPath = mapping.api_field_path.replace(/^totals\./, "");
		const apiValue = getNestedValue(apiData.totals, fieldPath);

		if (mapping.template_field === "totalQty") {
			const ctn = apiData.totals?.totalInvoiceCtn || 0;
			const pcs = apiData.totals?.totalInvoicePcs || 0;
			summary[mapping.template_field] = `${ctn}Ctn, ${pcs} Pcs`;
		} else if (mapping.template_field === "totalDiscountPercent") {
			summary[mapping.template_field] = apiValue ? `${apiValue}%` : "0.00%";
		} else {
			// Ensure numeric values are numbers
			const numericFields = ["tpValue", "totalDiscount", "grossValue", "totalGSTValue", "totalADTValue", "netValue"];
			if (numericFields.includes(mapping.template_field)) {
				summary[mapping.template_field] = typeof apiValue === "number" ? apiValue : (parseFloat(apiValue) || 0);
			} else {
				summary[mapping.template_field] = apiValue || 0;
			}
		}
	});

	// Transform notes
	const notes = {};
	mappingsBySection.notes.forEach((mapping) => {
		const apiValue = getNestedValue(apiData, mapping.api_field_path);
		notes[mapping.template_field] = apiValue || "";
	});

	// Add dates for printedOn
	const dates = {
		printedOn: formatDate(apiData.dates?.printedOn) || new Date().toISOString().split("T")[0],
	};

	return {
		header,
		lineItems,
		summary,
		notes,
		dates,
	};
};

/**
 * Applies template HTML with Mustache rendering
 * Note: This requires Mustache library to be installed
 * @param {Object} apiData - The API response data
 * @param {Object} template - Template object with html, mappings, aggregations
 * @returns {string} Rendered HTML string
 */
export const applyTemplate = async (apiData, template) => {
	// Transform API data using mappings
	const transformedData = transformApiDataToTemplate(
		apiData,
		template.mappings || [],
		template.aggregations || []
	);

	// Note: In a real implementation, you would use Mustache.render here
	// For now, we'll return a placeholder that indicates Mustache should be used
	// You'll need to install: npm install mustache
	// Then use: const Mustache = require('mustache');
	// return Mustache.render(template.html, transformedData);

	// Placeholder implementation - in production, use Mustache library
	console.warn(
		"Mustache rendering not implemented. Install 'mustache' package and use Mustache.render()"
	);
	return template.html; // Return template HTML as-is for now
};
