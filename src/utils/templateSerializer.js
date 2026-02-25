/**
 * Serializes React component template state to JSON
 * @param {Object} templateState - The template state object
 * @returns {Object} Serialized template configuration
 */
export const serializeTemplateState = (templateState) => {
	return {
		header: {
			topRow: templateState.header?.topRow || [],
			left: templateState.header?.left || [],
			right: templateState.header?.right || [],
		},
		lineItems: templateState.lineItems || [],
		summary: templateState.summary || [],
		showCtSize: templateState.showCtSize ?? true,
		showBarcode: templateState.showBarcode ?? false,
		showHsCode: templateState.showHsCode ?? false,
		summaryLayout: templateState.summaryLayout || "split",
		fontSize: templateState.fontSize || 9,
		showTableBorders: templateState.showTableBorders ?? false,
		columnLabels: templateState.columnLabels || {},
		aggregations: templateState.aggregations || [],
		paperSize: templateState.paperSize || "A4",
		footer: templateState.footer || [],
	};
};

/**
 * Deserializes JSON template configuration to React component state
 * @param {Object} templateConfig - The template configuration JSON
 * @returns {Object} Template state object
 */
export const deserializeTemplateState = (templateConfig) => {
	if (!templateConfig) {
		return null;
	}

	return {
		header: {
			topRow: templateConfig.header?.topRow || ["companyName", "invoiceType"],
			left: templateConfig.header?.left || ["customerName", "cnic", "phone", "address"],
			right: templateConfig.header?.right || [
				"distributorAddress",
				"distributorNTN",
				"distributorSTN",
				"tcn",
				"invoiceNo",
				"bookingDate",
				"deliveryDate",
				"booker",
				"salesman",
			],
		},
		lineItems: templateConfig.lineItems || [
			"sku",
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
		],
		summary: templateConfig.summary || [
			"totalQty",
			"tpValue",
			"totalDiscount",
			"totalDiscountPercent",
			"grossValue",
			"totalGSTValue",
			"totalADTValue",
			"netValue",
		],
		showCtSize: templateConfig.showCtSize ?? true,
		showBarcode: templateConfig.showBarcode ?? false,
		showHsCode: templateConfig.showHsCode ?? false,
		summaryLayout: templateConfig.summaryLayout || "split",
		fontSize: templateConfig.fontSize || 9,
		showTableBorders: templateConfig.showTableBorders ?? false,
		columnLabels: templateConfig.columnLabels || {},
		aggregations: templateConfig.aggregations || [],
		paperSize: templateConfig.paperSize || "A4",
		footer: templateConfig.footer || [],
	};
};
