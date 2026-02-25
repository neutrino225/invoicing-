/**
 * Simple, robust template engine using [PLACEHOLDER] syntax
 * No external dependencies - pure JavaScript string replacement
 */

/**
 * Gets a nested value from an object using dot notation
 * @param {Object} obj - The object to traverse
 * @param {string} path - Dot notation path (e.g., "header.customerName")
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
 * Formats a value for display
 * @param {*} value - The value to format
 * @returns {string} Formatted string
 */
const formatValue = (value) => {
	if (value === null || value === undefined) return "";
	if (typeof value === "number") {
		// Format numbers with 2 decimal places if needed
		return value % 1 === 0 ? value.toString() : value.toFixed(2);
	}
	return String(value);
};

/**
 * Renders a template with data using [PLACEHOLDER] syntax
 * Supports:
 * - Simple placeholders: [fieldName]
 * - Nested placeholders: [header.customerName]
 * - Array loops: [#lineItems]...[/lineItems]
 * - Conditionals: [#if field]...[/if]
 * - Index in loops: [_index]
 * 
 * @param {string} template - The template string
 * @param {Object} data - The data object
 * @returns {string} Rendered template
 */
export const renderTemplate = (template, data) => {
	if (!template || !data) return template || "";

	let result = template;

	// Handle array loops: [#arrayName]...[/arrayName]
	// Use a more robust regex that handles nested loops
	let loopRegex = /\[#(\w+(?:\.\w+)*)\]([\s\S]*?)\[\/\1\]/g;
	let loopMatch;
	while ((loopMatch = loopRegex.exec(result)) !== null) {
		const [fullMatch, arrayPath, content] = loopMatch;
		const array = getNestedValue(data, arrayPath);
		
		if (!Array.isArray(array)) {
			result = result.replace(fullMatch, "");
			loopRegex.lastIndex = 0; // Reset regex
			continue;
		}

		const renderedContent = array
			.map((item, index) => {
				let itemContent = content;
				
				// Replace _index placeholder first
				itemContent = itemContent.replace(/\[_index\]/g, String(index + 1));

				// Handle nested conditionals within loop: [#if field]...[/if]
				let conditionalRegex = /\[#if\s+(\w+(?:\.\w+)*)\]([\s\S]*?)\[\/if\]/g;
				let condMatch;
				while ((condMatch = conditionalRegex.exec(itemContent)) !== null) {
					const [condFullMatch, fieldPath, condContent] = condMatch;
					// First try item, then parent data
					let fieldValue = getNestedValue(item, fieldPath);
					if (fieldValue === undefined) {
						fieldValue = getNestedValue(data, fieldPath);
					}
					if (fieldValue && String(fieldValue).trim() !== "" && String(fieldValue) !== "0") {
						itemContent = itemContent.replace(condFullMatch, condContent);
					} else {
						itemContent = itemContent.replace(condFullMatch, "");
					}
					conditionalRegex.lastIndex = 0; // Reset for next iteration
				}

				// Replace all placeholders in the loop content
				// Handle nested placeholders like [fieldName] or [nested.field]
				const placeholderRegex = /\[(\w+(?:\.\w+)*)\]/g;
				itemContent = itemContent.replace(placeholderRegex, (placeholderMatch, fieldPath) => {
					// First try to get from the item object
					let value = getNestedValue(item, fieldPath);
					// If not found, try from parent data (for accessing summary, header, etc.)
					if (value === undefined) {
						value = getNestedValue(data, fieldPath);
					}
					// Debug: Log missing values
					if (value === undefined && fieldPath !== "_index") {
						console.warn(`[Template Engine] Missing value for field: ${fieldPath}`, {
							itemKeys: Object.keys(item),
							item: item
						});
					}
					return formatValue(value);
				});

				return itemContent;
			})
			.join("");

		result = result.replace(fullMatch, renderedContent);
		loopRegex.lastIndex = 0; // Reset regex for next match
	}

	// Handle conditionals: [#if field]...[/if]
	const conditionalRegex = /\[#if\s+(\w+(?:\.\w+)*)\]([\s\S]*?)\[\/if\]/g;
	result = result.replace(conditionalRegex, (match, fieldPath, content) => {
		const value = getNestedValue(data, fieldPath);
		if (value && String(value).trim() !== "" && String(value) !== "0") {
			return content;
		}
		return "";
	});

	// Replace all remaining placeholders: [fieldName] or [nested.field]
	const placeholderRegex = /\[(\w+(?:\.\w+)*)\]/g;
	result = result.replace(placeholderRegex, (match, fieldPath) => {
		const value = getNestedValue(data, fieldPath);
		return formatValue(value);
	});

	return result;
};

/**
 * Converts Mustache syntax to our [PLACEHOLDER] syntax
 * @param {string} mustacheTemplate - Template with Mustache syntax
 * @returns {string} Template with [PLACEHOLDER] syntax
 */
export const convertMustacheToPlaceholder = (mustacheTemplate) => {
	if (!mustacheTemplate) return "";

	let result = mustacheTemplate;

	// First, handle invalid Mustache syntax like {{${fieldId}}} - these are JavaScript template literals
	// We need to extract the fieldId and convert to proper placeholder
	// This handles cases where template generation created invalid syntax
	result = result.replace(/\{\{\$\{(\w+)\}\}\}/g, "[$1]");

	// Convert {{#arrayName}}...{{/arrayName}} to [#arrayName]...[/arrayName]
	result = result.replace(/\{\{#(\w+(?:\.\w+)*)\}\}/g, "[#$1]");
	result = result.replace(/\{\{\/(\w+(?:\.\w+)*)\}\}/g, "[/$1]");

	// Convert {{#if field}}...{{/if}} to [#if field]...[/if]
	result = result.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}/g, "[#if $1]");
	result = result.replace(/\{\{\/if\}\}/g, "[/if]");

	// Convert {{fieldName}} or {{nested.field}} to [fieldName] or [nested.field]
	// This must come after the ${fieldId} replacement to avoid conflicts
	result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, "[$1]");

	// Convert {{@index}} or {{_index}} to [_index]
	result = result.replace(/\{\{(@index|_index)\}\}/g, "[_index]");

	return result;
};
