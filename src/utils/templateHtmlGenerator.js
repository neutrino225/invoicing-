/**
 * Generates HTML string with Mustache placeholders from template state
 * @param {Object} templateState - The template state configuration
 * @param {Object} invoiceData - Sample invoice data for structure reference
 * @param {string} paperSize - Paper size (A4, A5, Letter)
 * @param {Object} columnWidths - Optional pre-calculated column widths (in pixels)
 * @returns {string} HTML string with Mustache placeholders
 */
export const generateTemplateHtml = (templateState, invoiceData, paperSize = "A4", columnWidths = null) => {
	const PAPER_SIZES = {
		A4: { width: "210mm", height: "297mm", widthMm: 210 },
		A5: { width: "148mm", height: "210mm", widthMm: 148 },
		Letter: { width: "215.9mm", height: "279.4mm", widthMm: 215.9 },
	};

	const calculatePadding = (size) => {
		const basePadding = 12;
		const baseWidth = 210;
		const paperWidth = PAPER_SIZES[size].widthMm;
		return Math.max(8, Math.round(((basePadding * paperWidth) / baseWidth) * 10) / 10);
	};

	// Calculate column widths if not provided
	const calculateColumnWidths = () => {
		if (columnWidths) return columnWidths;

		const COLUMN_TYPES = {
			SKU: "sku",
			NUMBER: ["ctn", "pcs", "rp", "tp", "tpVal", "firstDisc", "secondDisc", "thirdDisc", "fourthDisc", "grossValue", "others", "gstPercent", "gst", "advanceTax", "netValue"],
		};

		const BASE_WIDTH_CONSTRAINTS = {
			SKU: { min: 80, optimal: 120 },
			NUMBER: { min: 35, optimal: 50 },
			INDEX: { min: 30, optimal: 40 },
		};

		const getAdaptiveWidthConstraints = (size) => {
			const baseWidth = 210;
			const paperWidth = PAPER_SIZES[size].widthMm;
			const scaleFactor = size === "A5" ? 0.85 : 1.0;
			const ratio = (paperWidth / baseWidth) * scaleFactor;

			const constraints = {};
			Object.keys(BASE_WIDTH_CONSTRAINTS).forEach((key) => {
				const base = BASE_WIDTH_CONSTRAINTS[key];
				constraints[key] = {
					min: Math.max(25, Math.round(base.min * ratio)),
					optimal: Math.max(Math.round(base.min * ratio), Math.round(base.optimal * ratio)),
				};
			});
			return constraints;
		};

		const mmToPx = (mm) => mm * 3.7795275591;
		const padding = calculatePadding(paperSize);
		const availableWidth = mmToPx(PAPER_SIZES[paperSize].widthMm - padding * 2);
		const constraints = getAdaptiveWidthConstraints(paperSize);
		const baseFontSize = 9;
		const fontScaleFactor = (templateState.fontSize || 9) / baseFontSize;

		const columns = templateState.lineItems || [];
		const columnTypes = columns.map((colId) => {
			if (colId === "sku") return "SKU";
			if (COLUMN_TYPES.NUMBER.includes(colId)) return "NUMBER";
			return "NUMBER";
		});

		const baseWidths = [
			{ id: "index", type: "INDEX", width: constraints.INDEX.optimal * fontScaleFactor },
		];

		columns.forEach((colId) => {
			const type = colId === "sku" ? "SKU" : "NUMBER";
			const typeConstraints = constraints[type] || constraints.NUMBER;
			baseWidths.push({
				id: colId,
				type,
				width: typeConstraints.optimal * fontScaleFactor,
			});
		});

		const totalBaseWidth = baseWidths.reduce((sum, col) => sum + col.width, 0);

		if (totalBaseWidth <= availableWidth) {
			const result = {};
			baseWidths.forEach((col) => {
				result[col.id] = col.width;
			});
			return result;
		}

		let scaleFactor = availableWidth / totalBaseWidth;
		let scaledWidths = baseWidths.map((col) => {
			const scaled = col.width * scaleFactor;
			const typeConstraints = constraints[col.type] || constraints.NUMBER;
			const minWidth = typeConstraints.min * fontScaleFactor;
			return {
				...col,
				width: Math.max(scaled, minWidth),
			};
		});

		let totalScaledWidth = scaledWidths.reduce((sum, col) => sum + col.width, 0);
		let iterations = 0;
		const maxIterations = 5;

		while (totalScaledWidth > availableWidth && iterations < maxIterations) {
			const excess = totalScaledWidth - availableWidth;
			const nonMinColumns = scaledWidths.filter((col) => {
				const typeConstraints = constraints[col.type] || constraints.NUMBER;
				const minWidth = typeConstraints.min * fontScaleFactor;
				return col.width > minWidth;
			});

			if (nonMinColumns.length === 0) break;

			scaledWidths = scaledWidths.map((col) => {
				const typeConstraints = constraints[col.type] || constraints.NUMBER;
				const minWidth = typeConstraints.min * fontScaleFactor;
				if (col.width > minWidth) {
					const reductionFactor = col.type === "SKU" ? 0.7 : 1.0;
					const reduction = (excess / nonMinColumns.length) * reductionFactor;
					return {
						...col,
						width: Math.max(col.width - reduction, minWidth),
					};
				}
				return col;
			});

			totalScaledWidth = scaledWidths.reduce((sum, col) => sum + col.width, 0);
			iterations++;
		}

		const result = {};
		scaledWidths.forEach((col) => {
			result[col.id] = Math.round(col.width);
		});

		return result;
	};

	const widths = calculateColumnWidths();
	const padding = calculatePadding(paperSize);
	const paperConfig = PAPER_SIZES[paperSize];

	// Generate header section HTML
	const generateHeaderHtml = () => {
		let html = `<div class="invoice-top-border">
	<div class="invoice-top-content">
		[#if header.logo]
		<div class="invoice-top-logo">
			<img src="[header.logo]" alt="Distributor Logo" style="max-width: 80px; max-height: 80px; object-fit: contain;" />
		</div>
		[/if]
		<div class="invoice-top-center">
			<div class="invoice-top-company">
				${templateState.header.topRow
					.filter((f) => f === "companyName")
					.map(() => `<div style="font-weight: 700; font-size: 1.25em; text-align: center;">[header.companyName]</div>`)
					.join("")}
				[#if header.orderStatus]
				<div style="font-size: 0.875em; font-weight: 500; margin-top: 0.25rem; color: #6b7280; text-align: center;">[header.orderStatus]</div>
				[/if]
			</div>
			${templateState.header.topRow
				.filter((f) => f === "invoiceType")
				.map(() => `<div style="font-weight: 700; font-size: 1.25em; margin-top: 0.5rem;">[header.invoiceType]</div>`)
				.join("")}
		</div>
		<div style="display: flex; align-items: center;">
			${templateState.header.topRow
				.filter((f) => f === "invoiceType")
				.map(() => `<div style="font-weight: 700; font-size: 1.25em;">[header.invoiceType]</div>`)
				.join("")}
		</div>
	</div>
</div>

<div class="invoice-header-section">
	<div class="invoice-header-grid">
		<div class="invoice-header-column">
			${templateState.header.left
				.map((fieldId) => {
					const fieldLabels = {
						customerName: "Customer Name",
						cnic: "CNIC",
						phone: "Phone",
						address: "Address",
					};
					return `<div class="invoice-header-field">
				<span class="invoice-header-label">${fieldLabels[fieldId] || fieldId}: </span>
				<span>[header.${fieldId}]</span>
			</div>`;
				})
				.join("")}
		</div>
		<div class="invoice-header-column invoice-header-column-right">
			${templateState.header.right
				.map((fieldId) => {
					const fieldLabels = {
						distributorAddress: "Distributor Address",
						distributorNTN: "Distributor NTN",
						distributorSTN: "Distributor STN",
						tcn: "TCN",
						invoiceNo: "Invoice No",
						bookingDate: "Booking",
						deliveryDate: "Delivery",
						booker: "Booker",
						salesman: "Salesman",
					};
					return `<div class="invoice-header-field">
				<span class="invoice-header-label">${fieldLabels[fieldId] || fieldId}: </span>
				<span>[header.${fieldId}]</span>
			</div>`;
				})
				.join("")}
		</div>
	</div>
</div>`;

		return html;
	};

	// Generate line items table HTML
	const generateLineItemsHtml = () => {
		const hasSku = templateState.lineItems.includes("sku");
		const columns = templateState.lineItems.filter((f) => f !== "sku");

		// Get width styles for columns
		const getWidthStyle = (fieldId) => {
			const width = widths[fieldId];
			return width ? ` style="width: ${width}px;"` : "";
		};

		let html = `<div class="invoice-table-section">
	<table class="invoice-table">
		<thead>
			<tr class="invoice-table-header">
				<th class="invoice-table-header-cell${templateState.showTableBorders ? " invoice-table-header-cell-bordered" : ""}"${getWidthStyle("index")}>#</th>
				${hasSku ? `<th class="invoice-table-header-cell${templateState.showTableBorders ? " invoice-table-header-cell-bordered" : ""}"${getWidthStyle("sku")}>SKU / Product</th>` : ""}
				${columns
					.map((fieldId) => {
						// Check if it's an aggregation first
						const aggregation = templateState.aggregations.find((agg) => agg.id === fieldId);
						let label;
						if (aggregation) {
							label = aggregation.label || fieldId;
						} else {
							label = templateState.columnLabels[fieldId] || getFieldLabel(fieldId);
						}
						return `<th class="invoice-table-header-cell invoice-table-header-cell-right${templateState.showTableBorders ? " invoice-table-header-cell-bordered" : ""}"${getWidthStyle(fieldId)}>${label}</th>`;
					})
					.join("")}
			</tr>
		</thead>
		<tbody>
			[#lineItems]
			<tr class="${templateState.showTableBorders ? "" : "invoice-table-row"}">
				<td class="invoice-table-cell${templateState.showTableBorders ? " invoice-table-cell-bordered" : ""}"${getWidthStyle("index")}>[_index]</td>
				${hasSku
					? `<td class="invoice-table-cell invoice-sku-cell${templateState.showTableBorders ? " invoice-table-cell-bordered" : ""}"${getWidthStyle("sku")}>
					<div class="invoice-sku-name">[sku]</div>
					${templateState.showCtSize ? "[#if ctSize]<div class=\"invoice-sku-size\">* Ct.Size ([ctSize])</div>[/if]" : ""}
					${templateState.showBarcode ? "[#if barcode]<div class=\"invoice-sku-size\">* Barcode ([barcode])</div>[/if]" : ""}
					${templateState.showHsCode ? "[#if hsCode]<div class=\"invoice-sku-size\">* HS Code ([hsCode])</div>[/if]" : ""}
				</td>`
					: ""}
				${columns
					.map((fieldId) => {
						// Check if it's an aggregation - support both id and aggregation_id
						const aggregation = templateState.aggregations.find((agg) => agg.id === fieldId || agg.aggregation_id === fieldId);
						if (aggregation) {
							// Use the fieldId from lineItems array (this is what's in the template)
							// The data transformer will set both id and aggregation_id
							return `<td class="invoice-table-cell invoice-table-cell-right${templateState.showTableBorders ? " invoice-table-cell-bordered" : ""}"${getWidthStyle(fieldId)}>[${fieldId}]</td>`;
						}
						const fieldType = getFieldType(fieldId);
						// Format numbers with proper handling
						return `<td class="invoice-table-cell invoice-table-cell-right${templateState.showTableBorders ? " invoice-table-cell-bordered" : ""}"${getWidthStyle(fieldId)}>[${fieldId}]</td>`;
					})
					.join("")}
			</tr>
			[/lineItems]
		</tbody>
	</table>
</div>`;

		return html;
	};

	// Generate summary section HTML
	const generateSummaryHtml = () => {
		if (templateState.summaryLayout === "split") {
			return `<div class="invoice-summary-section">
	<div class="invoice-summary-grid">
		<div>
			<table class="invoice-summary-table">
				<tbody>
					${templateState.summary
						.map((fieldId) => {
							const fieldLabels = {
								totalQty: "Total Qty",
								tpValue: "TP Value",
								totalDiscount: "Total Discount",
								totalDiscountPercent: "Total Discount %",
								grossValue: "Gross Value",
								totalGSTValue: "Total GST",
								totalADTValue: "Total Advance Tax",
								netValue: "Net Value",
							};
							return `<tr class="invoice-summary-row">
						<td class="invoice-summary-label">${fieldLabels[fieldId] || fieldId}</td>
						<td class="invoice-summary-value">[summary.${fieldId}]</td>
					</tr>`;
						})
						.join("")}
				</tbody>
			</table>
		</div>
		<div class="invoice-sign-area">
			<div class="invoice-sign-content">
				<div class="invoice-sign-title">Sign & Stamp</div>
				<div class="invoice-sign-date">printed on: [dates.printedOn]</div>
			</div>
		</div>
	</div>
</div>`;
		} else {
			return `<div class="invoice-summary-section">
	<div>
		<table class="invoice-summary-table">
			<tbody>
				${templateState.summary
					.map((fieldId) => {
						const fieldLabels = {
							totalQty: "Total Qty",
							tpValue: "TP Value",
							totalDiscount: "Total Discount",
							totalDiscountPercent: "Total Discount %",
							grossValue: "Gross Value",
							totalGSTValue: "Total GST",
							totalADTValue: "Total Advance Tax",
							netValue: "Net Value",
						};
						return `<tr class="invoice-summary-row">
					<td class="invoice-summary-label">${fieldLabels[fieldId] || fieldId}</td>
					<td class="invoice-summary-value">{{summary.${fieldId}}}</td>
				</tr>`;
					})
					.join("")}
			</tbody>
		</table>
		<div class="invoice-summary-full">
			<div class="invoice-sign-title">Sign & Stamp</div>
			<div class="invoice-sign-date invoice-sign-date-inline">printed on: {{dates.printedOn}}</div>
		</div>
	</div>
</div>`;
		}
	};

	// Helper function to escape HTML
	const escapeHtml = (text) => {
		if (!text) return '';
		return String(text)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	};

	// Generate footer HTML
	const generateFooterHtml = () => {
		let html = `<div class="invoice-footer-section" style="display: block; visibility: visible; page-break-inside: avoid;">`;
		
		// Custom footer text
		if (templateState.footer && templateState.footer.length > 0) {
			templateState.footer.forEach((row, rowIndex) => {
				if (row && row.length > 0) {
					// Check if row has any non-empty text
					const hasContent = row.some(cell => cell && cell.text && cell.text.trim());
					if (hasContent) {
						html += `<div class="invoice-footer-row" style="display: flex; gap: 1rem; margin-bottom: ${rowIndex < templateState.footer.length - 1 ? '0.5rem' : '0.75rem'}; visibility: visible; page-break-inside: avoid;">`;
						row.forEach((cell, cellIndex) => {
							if (cell && cell.text && cell.text.trim()) {
								const align = cell.align || 'left';
								html += `<div class="invoice-footer-cell" style="flex: 1; text-align: ${align}; color: #000000; font-size: ${templateState.fontSize}px; visibility: visible;">${escapeHtml(cell.text.trim())}</div>`;
							}
						});
						html += `</div>`;
					}
				}
			});
		}
		
		// Notes section
		html += `[#if notes.orderComment]
	<div class="invoice-footer-note" style="display: block; visibility: visible;">
		<div class="invoice-footer-label">Order Comments:</div>
		<div class="invoice-footer-value">[notes.orderComment]</div>
	</div>
	[/if]
	[#if notes.saleNotes]
	<div class="invoice-footer-note" style="display: block; visibility: visible;">
		<div class="invoice-footer-label">Sales Notes:</div>
		<div class="invoice-footer-value">[notes.saleNotes]</div>
	</div>
	[/if]
</div>`;
		
		return html;
	};

	// Helper function to get field label
	const getFieldLabel = (fieldId) => {
		const labels = {
			ctn: "Ctn",
			pcs: "Pcs",
			rp: "R.P",
			tp: "T.P",
			tpVal: "TP Val",
			firstDisc: "First Disc",
			secondDisc: "Second Disc",
			thirdDisc: "Third Disc",
			fourthDisc: "Fourth Disc",
			grossValue: "Gross Value",
			others: "Others",
			gstPercent: "GST %",
			gst: "GST Val",
			advanceTax: "Advance Tax",
			netValue: "Net Val",
		};
		return labels[fieldId] || fieldId;
	};

	// Helper function to get field type
	const getFieldType = (fieldId) => {
		const numberFields = [
			"ctn",
			"pcs",
			"rp",
			"tp",
			"tpVal",
			"firstDisc",
			"secondDisc",
			"thirdDisc",
			"fourthDisc",
			"grossValue",
			"others",
			"gstPercent",
			"gst",
			"advanceTax",
			"netValue",
		];
		return numberFields.includes(fieldId) ? "number" : "text";
	};

	// Combine all sections
	const html = `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		/* Include all CSS from invoiceGenerator.css */
		${getInlineStyles()}
	</style>
</head>
<body>
	<div class="invoice-paper" style="width: ${paperConfig.width}; min-height: ${paperConfig.height}; padding: ${padding}mm; font-size: ${templateState.fontSize}px; box-sizing: border-box;">
		${generateHeaderHtml()}
		${generateLineItemsHtml()}
		${generateSummaryHtml()}
		${generateFooterHtml()}
	</div>
</body>
</html>`;

	return html;
};

/**
 * Gets inline styles for the template (simplified version)
 * In production, you might want to include the full CSS file
 */
const getInlineStyles = () => {
	return `
		.invoice-paper { background-color: white; color: #000000; }
		.invoice-top-border { border-top: 2px solid black; border-bottom: 2px solid black; padding: 0.5rem 0; margin-bottom: 0.75rem; }
		.invoice-top-content { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
		.invoice-top-logo { display: flex; align-items: center; justify-content: center; min-width: 80px; }
		.invoice-top-center { flex: 1; text-align: center; color: #000000; display: flex; flex-direction: column; align-items: center; }
		.invoice-top-company { display: flex; flex-direction: column; align-items: center; }
		.invoice-header-section { border-bottom: 2px solid black; padding-bottom: 0.75rem; margin-bottom: 0.75rem; }
		.invoice-header-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
		.invoice-header-column { display: flex; flex-direction: column; gap: 0.25rem; }
		.invoice-header-column-right { text-align: right; }
		.invoice-header-field { color: #000000; }
		.invoice-header-label { font-weight: 600; color: #000000; }
		.invoice-table-section { border-bottom: 2px solid black; padding-bottom: 0.75rem; margin-bottom: 0.75rem; overflow-x: hidden; }
		.invoice-table { width: 100%; border-collapse: collapse; table-layout: fixed; box-sizing: border-box; }
		.invoice-table-header { border-bottom: 1px solid black; }
		.invoice-table-header-cell { padding: 0.25rem 0.5rem; text-align: left; font-weight: 700; color: #000000; box-sizing: border-box; }
		.invoice-table-header-cell-right { text-align: right; }
		.invoice-table-row { border-bottom: 1px solid #d1d5db; }
		.invoice-table-cell { padding: 0.5rem; vertical-align: top; color: #000000; word-wrap: break-word; overflow-wrap: break-word; box-sizing: border-box; word-break: normal; }
		.invoice-table-cell-right { text-align: right; }
		.invoice-sku-cell { word-wrap: break-word; overflow-wrap: break-word; word-break: normal; hyphens: none; }
		.invoice-sku-name { font-weight: 500; color: #000000; }
		.invoice-sku-size { color: #4b5563; font-style: italic; margin-top: 0.25rem; }
		.invoice-summary-section { border-bottom: 2px solid black; padding-bottom: 0.75rem; margin-bottom: 0.75rem; }
		.invoice-summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
		.invoice-summary-table { width: 100%; border-collapse: collapse; }
		.invoice-summary-row { border-bottom: 1px solid #d1d5db; }
		.invoice-summary-label { padding: 0.25rem 0; padding-right: 1rem; font-weight: 600; color: #000000; }
		.invoice-summary-value { padding: 0.25rem 0; text-align: right; font-family: monospace; border-left: 1px solid #d1d5db; padding-left: 1rem; color: #000000; }
		.invoice-sign-area { display: flex; flex-direction: column; justify-content: flex-end; }
		.invoice-sign-content { text-align: right; }
		.invoice-sign-title { font-weight: 600; margin-bottom: 2rem; color: #000000; }
		.invoice-sign-date { border-top: 1px solid black; padding-top: 0.5rem; color: #000000; }
		.invoice-summary-full { margin-top: 1rem; }
		.invoice-sign-date-inline { display: inline-block; margin-left: 1rem; }
		.invoice-footer-section { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb; display: block; visibility: visible; page-break-inside: avoid; }
		.invoice-footer-row { display: flex; gap: 1rem; margin-bottom: 0.5rem; color: #000000; page-break-inside: avoid; }
		.invoice-footer-row:last-child { margin-bottom: 0.75rem; }
		.invoice-footer-cell { flex: 1; color: #000000; visibility: visible; }
		.invoice-footer-note { margin-bottom: 0.75rem; color: #000000; display: block; visibility: visible; }
		.invoice-footer-label { font-weight: 600; margin-bottom: 0.25rem; color: #000000; }
		.invoice-footer-value { color: #000000; line-height: 1.5; }
		@media print {
			.invoice-footer-section { display: block !important; visibility: visible !important; opacity: 1 !important; page-break-inside: avoid !important; }
			.invoice-footer-row { display: flex !important; visibility: visible !important; opacity: 1 !important; page-break-inside: avoid !important; }
			.invoice-footer-cell { visibility: visible !important; opacity: 1 !important; color: #000000 !important; }
			.invoice-footer-note { display: block !important; visibility: visible !important; opacity: 1 !important; }
		}
	`;
};

/**
 * Generates mappings array from template state
 * @param {Object} templateState - The template state
 * @returns {Array} Array of mapping objects
 */
export const generateMappings = (templateState) => {
	const mappings = [];

	// Header mappings
	const headerMappings = {
		companyName: "distributor.name",
		invoiceType: "invoiceType",
		orderStatus: "orderStatus",
		logo: "distributor.logo",
		cnic: "",
		phone: "customer.phone",
		address: "customer.address",
		invoiceNo: "invoiceId",
		bookingDate: "dates.bookingDate",
		deliveryDate: "dates.deliveryDate",
		booker: "booker",
		salesman: "salesman",
		customerName: "customer.name",
		tcn: "referenceNo",
		distributorAddress: "distributor.address",
		distributorNTN: "distributor.ntn",
		distributorSTN: "distributor.stn",
	};

	templateState.header.topRow.forEach((fieldId, index) => {
		if (headerMappings[fieldId] !== undefined) {
			mappings.push({
				section: "header",
				template_field: fieldId,
				api_field_path: headerMappings[fieldId],
				custom_label: templateState.columnLabels[fieldId] || null,
				field_order: index,
			});
		}
	});

	templateState.header.left.forEach((fieldId, index) => {
		if (headerMappings[fieldId] !== undefined) {
			mappings.push({
				section: "header",
				template_field: fieldId,
				api_field_path: headerMappings[fieldId],
				custom_label: null,
				field_order: index,
			});
		}
	});

	templateState.header.right.forEach((fieldId, index) => {
		if (headerMappings[fieldId] !== undefined) {
			mappings.push({
				section: "header",
				template_field: fieldId,
				api_field_path: headerMappings[fieldId],
				custom_label: null,
				field_order: index,
			});
		}
	});

	// Line items mappings
	const lineItemMappings = {
		sku: "itemName",
		ctSize: "ctnSize",
		barcode: "barCode",
		hsCode: "hsCode",
		ctn: "quantity.ctn",
		pcs: "quantity.pcs",
		rp: "pricing.retailPrice",
		tp: "pricing.unitPrice",
		tpVal: "pricing.tpValue",
		firstDisc: "pricing.discounts.firstDisc",
		secondDisc: "pricing.discounts.secondDisc",
		thirdDisc: "pricing.discounts.thirdDisc",
		fourthDisc: "pricing.discounts.fourthDisc",
		grossValue: "pricing.netValue",
		others: "pricing.gst.value",
		gstPercent: "pricing.gst.percent",
		gst: "pricing.gst.value",
		advanceTax: "pricing.advanceTax",
		netValue: "pricing.netValue",
	};

	templateState.lineItems.forEach((fieldId, index) => {
		if (lineItemMappings[fieldId] !== undefined) {
			mappings.push({
				section: "lineItems",
				template_field: fieldId,
				api_field_path: lineItemMappings[fieldId],
				custom_label: templateState.columnLabels[fieldId] || null,
				field_order: index,
			});
		}
	});

	// Summary mappings
	const summaryMappings = {
		totalQty: "totals.totalInvoiceCtn",
		tpValue: "totals.totalTPVal",
		totalDiscount: "totals.totalDiscount",
		totalDiscountPercent: "totals.totalDiscountPercent",
		grossValue: "totals.totalGrossValue",
		totalGSTValue: "totals.totalGSTValue",
		totalADTValue: "totals.totalADTValue",
		netValue: "totals.totalNetValue",
	};

	templateState.summary.forEach((fieldId, index) => {
		if (summaryMappings[fieldId] !== undefined) {
			mappings.push({
				section: "summary",
				template_field: fieldId,
				api_field_path: summaryMappings[fieldId],
				custom_label: null,
				field_order: index,
			});
		}
	});

	// Notes mappings
	mappings.push(
		{
			section: "notes",
			template_field: "orderComment",
			api_field_path: "notes.orderComment",
			custom_label: null,
			field_order: 0,
		},
		{
			section: "notes",
			template_field: "saleNotes",
			api_field_path: "notes.saleNotes",
			custom_label: null,
			field_order: 1,
		}
	);

	return mappings;
};

/**
 * Generates aggregations array from template state
 * @param {Object} templateState - The template state
 * @returns {Array} Array of aggregation objects
 */
export const generateAggregations = (templateState) => {
	return templateState.aggregations.map((agg, index) => ({
		aggregation_id: agg.id,
		label: agg.label,
		fields: agg.fields,
		type: agg.type,
		field_order: templateState.lineItems.indexOf(agg.id),
	}));
};
