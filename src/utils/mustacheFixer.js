/**
 * Fixes Mustache syntax issues in template HTML
 * Converts old syntax to proper Mustache syntax
 * @param {string} html - Template HTML string
 * @returns {string} Fixed HTML string
 */
export const fixMustacheSyntax = (html) => {
	if (!html || typeof html !== 'string') {
		return html;
	}

	let fixed = html;
	const stack = [];

	// Process the string character by character to handle nested tags correctly
	let result = '';
	let i = 0;

	while (i < fixed.length) {
		// Check for {{#each arrayName}}
		if (fixed.substring(i).startsWith('{{#each ')) {
			const match = fixed.substring(i).match(/^\{\{#each\s+(\w+)\}\}/);
			if (match) {
				const arrayName = match[1];
				result += `{{#${arrayName}}}`;
				stack.push(arrayName);
				i += match[0].length;
				continue;
			}
		}

		// Check for {{/each}}
		if (fixed.substring(i).startsWith('{{/each}}')) {
			if (stack.length > 0) {
				const arrayName = stack.pop();
				result += `{{/${arrayName}}}`;
				i += 10; // length of '{{/each}}'
				continue;
			} else {
				// No matching opening tag, just remove it or keep as is
				result += '{{/each}}';
				i += 10;
				continue;
			}
		}

		// Check for {{@index}}
		if (fixed.substring(i).startsWith('{{@index}}')) {
			result += '{{_index}}';
			i += 11; // length of '{{@index}}'
			continue;
		}

		// Regular character
		result += fixed[i];
		i++;
	}

	return result;
};
