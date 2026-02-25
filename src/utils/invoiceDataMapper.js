/**
 * Formats a date string to YYYY-MM-DD format
 * Handles both ISO format (2026-01-13T19:00:00.000Z) and simple date strings
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date in YYYY-MM-DD format
 */
export const formatDate = (dateString) => {
	if (!dateString) return "";

	try {
		// If it's already in YYYY-MM-DD format, return as is
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
			return dateString;
		}

		// Parse ISO date string
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return "";
		}

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	} catch (error) {
		console.error("Error formatting date:", error);
		return "";
	}
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
 * Maps API response to invoice data structure matching PLACEHOLDER_DATA
 * @param {Object} apiData - The invoice data from API response
 * @returns {Object} Mapped invoice data structure
 */
export const mapApiDataToInvoice = (apiData) => {
	if (!apiData) {
		throw new Error("API data is required");
	}

	// Map header fields
	const header = {
		companyName:
			apiData.distributor?.printingName || apiData.distributor?.name || "",
		invoiceType: apiData.invoiceType || "",
		orderStatus: apiData.orderStatus || "",
		logo: apiData.distributor?.logo || "",
		cnic: "", // Empty as per requirements
		phone: apiData.customer?.phone || "",
		address: apiData.customer?.address || "",
		invoiceNo: String(apiData.invoiceId || ""),
		bookingDate: formatDate(apiData.dates?.bookingDate),
		deliveryDate: formatDate(apiData.dates?.deliveryDate),
		booker: apiData.booker || "",
		salesman: apiData.salesman || "",
		customerName:
			apiData.customer?.name || apiData.customer?.businessName || "",
		tcn: apiData.referenceNo || "",
		// Distributor fields for right side
		distributorAddress: apiData.distributor?.address || "",
		distributorNTN: apiData.distributor?.ntn || "",
		distributorSTN: apiData.distributor?.stn || "",
	};

	// Map line items
	const lineItems = (apiData.items || []).map((item) => {
		const discounts = item.pricing?.discounts || {};
		const totalDiscount = calculateTotalDiscount(discounts);
		const pricing = item.pricing || {};
		const gstPercent = pricing.gst?.percent || 0;
		const gstValue = pricing.gst?.value || 0;
		const advanceTax = pricing.advanceTax || 0;
		const netValue = pricing.netValue || 0;

		// Calculate grossValue: netValue - advanceTax - gst
		const grossValue = netValue - advanceTax - gstValue;

		return {
			sku: item.itemName || "",
			ctSize: String(item.ctnSize || ""),
			barcode: item.barCode || "",
			hsCode: item.hsCode || "",
			ctn: item.quantity?.ctn || 0,
			pcs: item.quantity?.pcs || 0,
			rp: pricing.retailPrice || 0,
			tp: pricing.unitPrice || 0,
			tpVal: pricing.tpValue || 0,
			firstDisc: discounts.firstDisc || 0,
			secondDisc: discounts.secondDisc || 0,
			thirdDisc: discounts.thirdDisc || 0,
			fourthDisc: discounts.fourthDisc || 0,
			grossValue: grossValue,
			others: gstValue,
			gstPercent: gstPercent,
			gst: gstValue,
			advanceTax: advanceTax,
			netValue: netValue,
		};
	});

	// Map summary - using exact API response totals fields
	const totals = apiData.totals || {};
	const totalQty = `${totals.totalInvoiceCtn || 0}Ctn, ${totals.totalInvoicePcs || 0} Pcs`;

	const summary = {
		totalQty: totalQty,
		tpValue: totals.totalTPVal || 0,
		totalDiscount: totals.totalDiscount || 0,
		totalDiscountPercent: totals.totalDiscountPercent
			? `${totals.totalDiscountPercent}%`
			: "0.00%",
		grossValue: totals.totalGrossValue || 0,
		totalGSTValue: totals.totalGSTValue || 0,
		totalADTValue: totals.totalADTValue || 0,
		netValue: totals.totalNetValue || 0,
		// 'others' removed from summary as per requirements
		// Additional fields available in API but not used in current template:
		// totalFOCPcs
	};

	// Map notes
	const notes = {
		orderComment: apiData.notes?.orderComment || "",
		saleNotes: apiData.notes?.saleNotes || "",
	};

	return {
		header,
		lineItems,
		summary,
		notes,
	};
};
