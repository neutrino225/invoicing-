import React, { useState, useRef, useEffect, useMemo } from "react";
import {
	GripVertical,
	Eye,
	Edit,
	Save,
	Plus,
	Trash2,
	Settings,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import "./invoiceGenerator.css";

// Placeholder invoice data
const PLACEHOLDER_DATA = {
	header: {
		companyName: "Test Distributor",
		invoiceType: "Commercial Invoice",
		cnic: "12345-6789012-3",
		phone: "0321-1234567",
		address: "Potohhar Rd, I-8/3 I-9 I-9, Islamabad, 44000, Pakistan",
		invoiceNo: "OBD97395",
		bookingDate: "2026-01-08",
		deliveryDate: "2026-01-08",
		booker: "waqas",
		salesman: "waqas",
		customerName: "Waqas Gs (Waqas)",
		tcn: "TCN30317",
	},
	lineItems: [
		{
			sku: "ISLAMABAD TEA LEAF BLEND 430 GM",
			ctSize: "24",
			barcode: "1234567890123",
			ctn: 5,
			pcs: 0,
			rp: 851,
			tp: 102120,
			tpVal: 2400.0,
			tradeOffer: 1548.0,
			slabDisc: 98172,
			grossValue: 490.86,
			others: 98663,
			getValue: 0,
			advanceTax: 0,
			gst: 0,
		},
		{
			sku: "REFINED PINK SALT 800 GM",
			ctSize: "24",
			barcode: "2345678901234",
			ctn: 0,
			pcs: 1,
			rp: 55,
			tp: 55,
			tpVal: 19.33,
			tradeOffer: 0.0,
			slabDisc: 35.67,
			grossValue: 0.18,
			others: 36,
			getValue: 0,
			advanceTax: 0,
			gst: 0,
		},
		{
			sku: "PREMIUM GREEN TEA 250 GM",
			ctSize: "12",
			barcode: "3456789012345",
			ctn: 3,
			pcs: 0,
			rp: 450,
			tp: 5400,
			tpVal: 1200.0,
			tradeOffer: 540.0,
			slabDisc: 4860,
			grossValue: 250.0,
			others: 5110,
			getValue: 0,
			advanceTax: 0,
			gst: 0,
		},
	],
	summary: {
		totalQty: "8Ctn, 1 Pcs",
		tpValue: 102226.0,
		totalDiscount: 3948.0,
		grossValue: 98278.0,
		others: 490.86,
		netValue: 98662.86,
	},
};

// Available fields for each section
const AVAILABLE_FIELDS = {
	header: {
		topRow: [
			{ id: "companyName", label: "Company/Distributor Name" },
			{ id: "invoiceType", label: "Invoice Type" },
		],
		left: [
			{ id: "customerName", label: "Customer Name" },
			{ id: "cnic", label: "CNIC" },
			{ id: "phone", label: "Phone" },
			{ id: "address", label: "Address" },
		],
		right: [
			{ id: "tcn", label: "TCN" },
			{ id: "invoiceNo", label: "Invoice No" },
			{ id: "bookingDate", label: "Booking" },
			{ id: "deliveryDate", label: "Delivery" },
			{ id: "booker", label: "Booker" },
			{ id: "salesman", label: "Salesman" },
		],
	},
	lineItems: [
		{ id: "sku", label: "SKU / Product", type: "text" },
		{ id: "ctSize", label: "Ct.Size", type: "text" },
		{ id: "ctn", label: "Ctn", type: "number" },
		{ id: "pcs", label: "Pcs", type: "number" },
		{ id: "rp", label: "R.P", type: "number" },
		{ id: "tp", label: "T.P", type: "number" },
		{ id: "tpVal", label: "TP Val", type: "number" },
		{ id: "tradeOffer", label: "Trade Offer", type: "number" },
		{ id: "slabDisc", label: "Slab Disc", type: "number" },
		{ id: "grossValue", label: "Gross Value", type: "number" },
		{ id: "others", label: "Others", type: "number" },
		{ id: "getValue", label: "Get Value", type: "number" },
		{ id: "advanceTax", label: "Advance Tax", type: "number" },
		{ id: "gst", label: "GST", type: "number" },
	],
	summary: [
		{ id: "totalQty", label: "Total Qty" },
		{ id: "tpValue", label: "TP Value" },
		{ id: "totalDiscount", label: "Total Discount" },
		{ id: "grossValue", label: "Gross Value" },
		{ id: "others", label: "Others" },
		{ id: "netValue", label: "Net Value" },
	],
};

// Paper size dimensions in mm
const PAPER_SIZES = {
	A4: { width: "210mm", height: "297mm", widthMm: 210 },
	A5: { width: "148mm", height: "210mm", widthMm: 148 },
	Letter: { width: "215.9mm", height: "279.4mm", widthMm: 215.9 },
};

// Calculate proportional padding based on paper size (base: 12mm for A4)
const calculatePadding = (paperSize) => {
	const basePadding = 12; // mm for A4
	const baseWidth = 210; // A4 width in mm
	const paperWidth = PAPER_SIZES[paperSize].widthMm;
	// Proportional padding, minimum 8mm for very small papers
	return Math.max(
		8,
		Math.round(((basePadding * paperWidth) / baseWidth) * 10) / 10
	);
};

// Calculate adaptive cell padding based on paper size
const calculateCellPadding = (paperSize) => {
	// Base padding: 0.5rem (8px) for A4
	// Smaller padding for A5: 0.375rem (6px)
	// Use rem units, but calculate in pixels for now
	if (paperSize === "A5") {
		return 6; // 0.375rem ≈ 6px
	}
	return 8; // 0.5rem ≈ 8px
};

// Convert mm to pixels (1mm ≈ 3.7795275591px at 96 DPI)
const mmToPx = (mm) => mm * 3.7795275591;

// Column type definitions
const COLUMN_TYPES = {
	SKU: "sku",
	NUMBER: [
		"ctn",
		"pcs",
		"rp",
		"tp",
		"tpVal",
		"tradeOffer",
		"slabDisc",
		"grossValue",
		"others",
		"getValue",
		"advanceTax",
		"gst",
	],
	TEXT: ["ctSize"],
};

// Base minimum and optimal widths (in pixels) for A4
const BASE_WIDTH_CONSTRAINTS = {
	SKU: { min: 80, optimal: 120 },
	NUMBER: { min: 35, optimal: 50 },
	TEXT: { min: 40, optimal: 60 },
	INDEX: { min: 30, optimal: 40 },
};

// Absolute minimum widths (hard limits, cannot go below)
const ABSOLUTE_MIN_WIDTHS = {
	SKU: 60,
	NUMBER: 28,
	TEXT: 32,
	INDEX: 25,
};

// Get adaptive width constraints based on paper size
const getAdaptiveWidthConstraints = (paperSize) => {
	const baseWidth = 210; // A4 width in mm
	const paperWidth = PAPER_SIZES[paperSize].widthMm;
	const scaleFactor = paperSize === "A5" ? 0.85 : 1.0; // More aggressive for A5
	const ratio = (paperWidth / baseWidth) * scaleFactor;

	const constraints = {};
	Object.keys(BASE_WIDTH_CONSTRAINTS).forEach((key) => {
		const base = BASE_WIDTH_CONSTRAINTS[key];
		const absoluteMin = ABSOLUTE_MIN_WIDTHS[key];
		const adaptiveMin = Math.max(absoluteMin, Math.round(base.min * ratio));
		const adaptiveOptimal = Math.max(
			adaptiveMin,
			Math.round(base.optimal * ratio)
		);
		constraints[key] = {
			min: adaptiveMin,
			optimal: adaptiveOptimal,
		};
	});

	return constraints;
};

const InvoiceTemplateCreator = () => {
	const [mode, setMode] = useState("edit");
	const [templateName, setTemplateName] = useState("New Template");
	const [paperSize, setPaperSize] = useState("A4");
	const printRef = useRef(null);

	// Template configuration
	const [template, setTemplate] = useState({
		header: {
			topRow: ["companyName", "invoiceType"],
			left: ["customerName", "cnic", "phone", "address"],
			right: [
				"tcn",
				"invoiceNo",
				"bookingDate",
				"deliveryDate",
				"booker",
				"salesman",
			],
		},
		lineItems: [
			"sku",
			"ctn",
			"pcs",
			"rp",
			"tp",
			"tpVal",
			"tradeOffer",
			"slabDisc",
			"grossValue",
			"others",
			"getValue",
		],
		summary: [
			"totalQty",
			"tpValue",
			"totalDiscount",
			"grossValue",
			"others",
			"netValue",
		],
		showCtSize: true,
		showBarcode: false,
		summaryLayout: "split", // 'split' or 'full'
		fontSize: 9,
		showTableBorders: false,
		columnLabels: {},
		aggregations: [],
	});

	const [expandedSections, setExpandedSections] = useState({
		header: true,
		lineItems: true,
		summary: true,
	});

	// State for table overflow handling
	const [columnWidths, setColumnWidths] = useState({});
	const [adjustedFontSize, setAdjustedFontSize] = useState(null);

	const toggleField = (section, subsection, field) => {
		if (section === "header") {
			setTemplate((prev) => ({
				...prev,
				header: {
					...prev.header,
					[subsection]: prev.header[subsection].includes(field)
						? prev.header[subsection].filter((f) => f !== field)
						: [...prev.header[subsection], field],
				},
			}));
		} else {
			setTemplate((prev) => ({
				...prev,
				[section]: prev[section].includes(field)
					? prev[section].filter((f) => f !== field)
					: [...prev[section], field],
			}));
		}
	};

	const moveField = (section, subsection, field, direction) => {
		if (section === "header") {
			const arr = [...template.header[subsection]];
			const index = arr.indexOf(field);
			if (direction === "up" && index > 0) {
				[arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
			} else if (direction === "down" && index < arr.length - 1) {
				[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
			}
			setTemplate((prev) => ({
				...prev,
				header: { ...prev.header, [subsection]: arr },
			}));
		} else {
			const arr = [...template[section]];
			const index = arr.indexOf(field);
			if (direction === "up" && index > 0) {
				[arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
			} else if (direction === "down" && index < arr.length - 1) {
				[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
			}
			setTemplate((prev) => ({ ...prev, [section]: arr }));
		}
	};

	const handlePrint = () => {
		window.print();
	};

	const saveTemplate = () => {
		console.log("Saving template:", { name: templateName, config: template });
		alert("Template saved! (In production, this would save to your backend)");
	};

	const toggleSection = (section) => {
		setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
	};

	// Helper function to get column label (handles regular fields and aggregations)
	const getColumnLabel = (fieldId) => {
		// Check if it's an aggregation
		const aggregation = template.aggregations.find((agg) => agg.id === fieldId);
		if (aggregation) {
			return aggregation.label;
		}
		// Check for custom label
		if (template.columnLabels[fieldId]) {
			return template.columnLabels[fieldId];
		}
		// Return default label
		const field = AVAILABLE_FIELDS.lineItems.find((f) => f.id === fieldId);
		return field ? field.label : fieldId;
	};

	// Helper function to get aggregation for a column
	const getAggregationForColumn = (fieldId) => {
		return template.aggregations.find((agg) => agg.id === fieldId);
	};

	// Calculate aggregated value for a row
	const calculateAggregatedValue = (item, aggregation) => {
		if (!aggregation || !aggregation.fields) return 0;
		return aggregation.fields.reduce((sum, fieldId) => {
			const value = item[fieldId];
			return sum + (typeof value === "number" ? value : 0);
		}, 0);
	};

	// Add aggregation
	const addAggregation = (fields, label, type) => {
		const id = `agg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const newAggregation = {
			id,
			label,
			fields,
			type,
		};

		setTemplate((prev) => {
			const updatedAggregations = [...prev.aggregations, newAggregation];
			let updatedLineItems = [...prev.lineItems];

			if (type === "replace") {
				// Remove source field IDs from lineItems
				updatedLineItems = updatedLineItems.filter((f) => !fields.includes(f));
				// Add aggregation ID
				updatedLineItems.push(id);
			} else {
				// Add aggregation ID
				updatedLineItems.push(id);
			}

			return {
				...prev,
				aggregations: updatedAggregations,
				lineItems: updatedLineItems,
			};
		});
	};

	// Remove aggregation
	const removeAggregation = (aggregationId) => {
		setTemplate((prev) => {
			const updatedAggregations = prev.aggregations.filter(
				(agg) => agg.id !== aggregationId
			);
			const updatedLineItems = prev.lineItems.filter(
				(f) => f !== aggregationId
			);
			return {
				...prev,
				aggregations: updatedAggregations,
				lineItems: updatedLineItems,
			};
		});
	};

	// State for inline editing
	const [editingField, setEditingField] = useState(null);
	const [editingValue, setEditingValue] = useState("");

	// State for aggregation modal
	const [showAggregationModal, setShowAggregationModal] = useState(false);
	const [aggregationFields, setAggregationFields] = useState([]);
	const [aggregationLabel, setAggregationLabel] = useState("");
	const [aggregationType, setAggregationType] = useState("add");
	const [selectedFieldForAggregation, setSelectedFieldForAggregation] =
		useState(null);

	// Check if a field is replaced by an aggregation
	const isFieldReplacedByAggregation = (fieldId) => {
		return template.aggregations.some(
			(agg) => agg.type === "replace" && agg.fields.includes(fieldId)
		);
	};

	// Get all visible fields (including aggregations)
	const getVisibleLineItemsFields = () => {
		const regularFields = AVAILABLE_FIELDS.lineItems.filter(
			(field) => !isFieldReplacedByAggregation(field.id)
		);
		const aggregationFields = template.aggregations.map((agg) => ({
			id: agg.id,
			label: agg.label,
			type: "aggregation",
		}));
		return [...regularFields, ...aggregationFields];
	};

	// Calculate optimal column widths based on available space (with iterative refinement)
	const calculateColumnWidths = (currentPaperSize, columns, userFontSize) => {
		const padding = calculatePadding(currentPaperSize); // Proportional padding
		const availableWidth = mmToPx(
			PAPER_SIZES[currentPaperSize].widthMm - padding * 2
		);

		// Get adaptive constraints based on paper size
		const constraints = getAdaptiveWidthConstraints(currentPaperSize);

		// Font size scaling factor (base font size: 9px)
		// Smaller font = narrower columns, larger font = wider columns
		const baseFontSize = 9;
		const fontScaleFactor = userFontSize / baseFontSize;

		// Determine column types
		const columnTypes = columns.map((colId) => {
			if (colId === "sku") return "SKU";
			if (COLUMN_TYPES.NUMBER.includes(colId)) return "NUMBER";
			if (COLUMN_TYPES.TEXT.includes(colId)) return "TEXT";
			return "NUMBER"; // default
		});

		// Calculate base widths (including index column) - scaled by font size
		const baseWidths = [
			{
				id: "index",
				type: "INDEX",
				width: constraints.INDEX.optimal * fontScaleFactor,
			},
		];

		columns.forEach((colId, idx) => {
			const type = columnTypes[idx];
			const typeConstraints = constraints[type];
			baseWidths.push({
				id: colId,
				type,
				width: typeConstraints.optimal * fontScaleFactor,
			});
		});

		// Calculate total base width
		const totalBaseWidth = baseWidths.reduce((sum, col) => sum + col.width, 0);

		// First pass: If it fits with optimal widths, return
		if (totalBaseWidth <= availableWidth) {
			const result = {};
			baseWidths.forEach((col) => {
				result[col.id] = col.width;
			});
			return { widths: result, fontSize: userFontSize };
		}

		// Second pass: Scale down proportionally with adaptive minimums (also scaled by font)
		let scaleFactor = availableWidth / totalBaseWidth;
		let scaledWidths = baseWidths.map((col) => {
			const scaled = col.width * scaleFactor;
			const typeConstraints = constraints[col.type];
			const minWidth = typeConstraints.min * fontScaleFactor;
			return {
				...col,
				width: Math.max(scaled, minWidth),
			};
		});

		// Check if scaled widths fit
		let totalScaledWidth = scaledWidths.reduce(
			(sum, col) => sum + col.width,
			0
		);

		// Third pass: Iterative refinement if still doesn't fit
		let iterations = 0;
		const maxIterations = 5;
		while (totalScaledWidth > availableWidth && iterations < maxIterations) {
			const excess = totalScaledWidth - availableWidth;
			const nonMinColumns = scaledWidths.filter((col) => {
				const typeConstraints = constraints[col.type];
				const minWidth = typeConstraints.min * fontScaleFactor;
				return col.width > minWidth;
			});

			if (nonMinColumns.length === 0) {
				// All columns at minimum, can't reduce more
				break;
			}

			// Prioritize: reduce NUMBER columns more aggressively than SKU
			scaledWidths = scaledWidths.map((col) => {
				const typeConstraints = constraints[col.type];
				const minWidth = typeConstraints.min * fontScaleFactor;
				if (col.width > minWidth) {
					// SKU columns get less reduction
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

		// Font size is now integrated into the calculation, so use user's font size
		// No automatic reduction - user controls font size via slider
		const finalFontSize = userFontSize;

		const result = {};
		scaledWidths.forEach((col) => {
			result[col.id] = Math.round(col.width);
		});

		return { widths: result, fontSize: finalFontSize };
	};

	// Calculate optimal font size if table still overflows
	const calculateOptimalFontSize = (
		availableWidthPx,
		columns,
		userFontSize,
		columnWidths
	) => {
		let fontSize = userFontSize;
		const minFontSize = 7;

		// Calculate if table fits with current font size
		// We'll use a simplified check: if column widths fit, font is fine
		const totalWidth = Object.values(columnWidths).reduce(
			(sum, w) => sum + w,
			0
		);

		if (totalWidth <= availableWidthPx) {
			return userFontSize;
		}

		// Try reducing font size (this affects text width, so we need to recalculate)
		// For now, return the user font size and let CSS handle overflow
		// The actual font reduction will be handled by the width calculation
		return Math.max(fontSize, minFontSize);
	};

	// Recalculate column widths when dependencies change
	useEffect(() => {
		const columns = template.lineItems || [];
		if (columns.length === 0) {
			setColumnWidths({});
			setAdjustedFontSize(null);
			return;
		}

		const result = calculateColumnWidths(paperSize, columns, template.fontSize);
		setColumnWidths(result.widths);
		// Font size is now integrated into calculation, always use user's font size
		setAdjustedFontSize(null);
	}, [paperSize, template.lineItems, template.fontSize]);

	return (
		<div className="invoice-container">
			{/* Editor Panel */}
			<div
				className={`editor-panel ${
					mode === "edit" ? "editor-panel-edit" : "editor-panel-preview"
				}`}>
				<div className="editor-header">
					<input
						type="text"
						value={templateName}
						onChange={(e) => setTemplateName(e.target.value)}
						className="editor-input"
						placeholder="Template Name"
					/>
					<select
						value={paperSize}
						onChange={(e) => setPaperSize(e.target.value)}
						className="editor-input"
						style={{ marginTop: "0.5rem" }}>
						<option value="A4">A4</option>
						<option value="A5">A5</option>
						<option value="Letter">Letter</option>
					</select>
				</div>

				<div className="editor-content">
					{/* Header Section */}
					<div className="section-container">
						<button
							onClick={() => toggleSection("header")}
							className="section-button">
							<span className="section-title">Header Fields</span>
							{expandedSections.header ? (
								<ChevronUp size={20} />
							) : (
								<ChevronDown size={20} />
							)}
						</button>
						{expandedSections.header && (
							<div className="section-content-spaced">
								{/* Top Row */}
								<div>
									<div className="field-group-title">Top Row</div>
									{AVAILABLE_FIELDS.header.topRow.map((field) => {
										const isActive = template.header.topRow.includes(field.id);
										const index = template.header.topRow.indexOf(field.id);
										return (
											<div
												key={field.id}
												className={`field-item ${
													isActive ? "field-item-active" : "field-item-inactive"
												}`}>
												<input
													type="checkbox"
													checked={isActive}
													onChange={() =>
														toggleField("header", "topRow", field.id)
													}
													className="field-checkbox"
												/>
												<span className="field-label">{field.label}</span>
												{isActive && (
													<div className="field-controls">
														<button
															onClick={() =>
																moveField("header", "topRow", field.id, "up")
															}
															disabled={index === 0}
															className="field-control-button">
															<ChevronUp size={14} />
														</button>
														<button
															onClick={() =>
																moveField("header", "topRow", field.id, "down")
															}
															disabled={
																index === template.header.topRow.length - 1
															}
															className="field-control-button">
															<ChevronDown size={14} />
														</button>
													</div>
												)}
											</div>
										);
									})}
								</div>

								{/* Left Column */}
								<div>
									<div className="field-group-title">Left Column</div>
									{AVAILABLE_FIELDS.header.left.map((field) => {
										const isActive = template.header.left.includes(field.id);
										const index = template.header.left.indexOf(field.id);
										return (
											<div
												key={field.id}
												className={`field-item ${
													isActive ? "field-item-active" : "field-item-inactive"
												}`}>
												<input
													type="checkbox"
													checked={isActive}
													onChange={() =>
														toggleField("header", "left", field.id)
													}
													className="field-checkbox"
												/>
												<span className="field-label">{field.label}</span>
												{isActive && (
													<div className="field-controls">
														<button
															onClick={() =>
																moveField("header", "left", field.id, "up")
															}
															disabled={index === 0}
															className="field-control-button">
															<ChevronUp size={14} />
														</button>
														<button
															onClick={() =>
																moveField("header", "left", field.id, "down")
															}
															disabled={
																index === template.header.left.length - 1
															}
															className="field-control-button">
															<ChevronDown size={14} />
														</button>
													</div>
												)}
											</div>
										);
									})}
								</div>

								{/* Right Column */}
								<div>
									<div className="field-group-title">Right Column</div>
									{AVAILABLE_FIELDS.header.right.map((field) => {
										const isActive = template.header.right.includes(field.id);
										const index = template.header.right.indexOf(field.id);
										return (
											<div
												key={field.id}
												className={`field-item ${
													isActive ? "field-item-active" : "field-item-inactive"
												}`}>
												<input
													type="checkbox"
													checked={isActive}
													onChange={() =>
														toggleField("header", "right", field.id)
													}
													className="field-checkbox"
												/>
												<span className="field-label">{field.label}</span>
												{isActive && (
													<div className="field-controls">
														<button
															onClick={() =>
																moveField("header", "right", field.id, "up")
															}
															disabled={index === 0}
															className="field-control-button">
															<ChevronUp size={14} />
														</button>
														<button
															onClick={() =>
																moveField("header", "right", field.id, "down")
															}
															disabled={
																index === template.header.right.length - 1
															}
															className="field-control-button">
															<ChevronDown size={14} />
														</button>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* Line Items Section */}
					<div className="section-container">
						<button
							onClick={() => toggleSection("lineItems")}
							className="section-button">
							<span className="section-title">Table Columns</span>
							{expandedSections.lineItems ? (
								<ChevronUp size={20} />
							) : (
								<ChevronDown size={20} />
							)}
						</button>
						{expandedSections.lineItems && (
							<div className="section-content-spaced-sm">
								<div className="option-box">
									<label className="option-label">
										<input
											type="checkbox"
											checked={template.showCtSize}
											onChange={(e) =>
												setTemplate((prev) => ({
													...prev,
													showCtSize: e.target.checked,
												}))
											}
											className="field-checkbox"
										/>
										<span className="option-text">
											Show Ct.Size under SKU name
										</span>
									</label>
								</div>
								<div className="option-box">
									<label className="option-label">
										<input
											type="checkbox"
											checked={template.showBarcode}
											onChange={(e) =>
												setTemplate((prev) => ({
													...prev,
													showBarcode: e.target.checked,
												}))
											}
											className="field-checkbox"
										/>
										<span className="option-text">
											Show Barcode under SKU name
										</span>
									</label>
								</div>
								{AVAILABLE_FIELDS.lineItems
									.filter((field) => !isFieldReplacedByAggregation(field.id))
									.map((field) => {
										const isActive = template.lineItems.includes(field.id);
										const index = template.lineItems.indexOf(field.id);
										const isNumberField = field.type === "number";
										const label = getColumnLabel(field.id);
										const isEditing = editingField === field.id;

										return (
											<div
												key={field.id}
												className={`field-item ${
													isActive ? "field-item-active" : "field-item-inactive"
												}`}>
												<input
													type="checkbox"
													checked={isActive}
													onChange={() =>
														toggleField("lineItems", null, field.id)
													}
													className="field-checkbox"
												/>
												{isEditing ? (
													<input
														type="text"
														value={editingValue}
														onChange={(e) => setEditingValue(e.target.value)}
														onBlur={() => {
															setTemplate((prev) => ({
																...prev,
																columnLabels: {
																	...prev.columnLabels,
																	[field.id]:
																		editingValue.trim() || field.label,
																},
															}));
															setEditingField(null);
															setEditingValue("");
														}}
														onKeyDown={(e) => {
															if (e.key === "Enter") {
																setTemplate((prev) => ({
																	...prev,
																	columnLabels: {
																		...prev.columnLabels,
																		[field.id]:
																			editingValue.trim() || field.label,
																	},
																}));
																setEditingField(null);
																setEditingValue("");
															} else if (e.key === "Escape") {
																setEditingField(null);
																setEditingValue("");
															}
														}}
														autoFocus
														className="field-label-input"
														style={{
															flex: 1,
															padding: "0.25rem",
															border: "1px solid #2563eb",
															borderRadius: "0.25rem",
															fontSize: "0.875rem",
															color: "#000000",
															backgroundColor: "#ffffff",
														}}
													/>
												) : (
													<span
														className="field-label"
														onClick={() => {
															setEditingField(field.id);
															setEditingValue(label);
														}}
														style={{ cursor: "pointer" }}>
														{template.columnLabels[field.id] &&
														template.columnLabels[field.id] !== field.label ? (
															<>
																<span
																	style={{
																		color: "#6b7280",
																		textDecoration: "line-through",
																	}}>
																	{field.label}
																</span>
																{" -> "}
																<span
																	style={{ fontWeight: 500, color: "#2563eb" }}>
																	{label}
																</span>
																<Edit
																	size={12}
																	style={{
																		marginLeft: "0.25rem",
																		color: "#2563eb",
																		verticalAlign: "middle",
																	}}
																/>
															</>
														) : (
															label
														)}
													</span>
												)}
												{isActive && (
													<div className="field-controls">
														{isNumberField && (
															<button
																onClick={() => {
																	setSelectedFieldForAggregation(field.id);
																	setAggregationFields([field.id]);
																	setAggregationLabel("");
																	setAggregationType("add");
																	setShowAggregationModal(true);
																}}
																className="field-control-button"
																title="Create aggregation">
																<Plus size={14} />
															</button>
														)}
														<button
															onClick={() =>
																moveField("lineItems", null, field.id, "up")
															}
															disabled={index === 0}
															className="field-control-button">
															<ChevronUp size={14} />
														</button>
														<button
															onClick={() =>
																moveField("lineItems", null, field.id, "down")
															}
															disabled={index === template.lineItems.length - 1}
															className="field-control-button">
															<ChevronDown size={14} />
														</button>
													</div>
												)}
											</div>
										);
									})}
								{/* Aggregation fields */}
								{template.aggregations.map((agg) => {
									const isActive = template.lineItems.includes(agg.id);
									const index = template.lineItems.indexOf(agg.id);
									const isEditing = editingField === agg.id;

									return (
										<div
											key={agg.id}
											className={`field-item ${
												isActive ? "field-item-active" : "field-item-inactive"
											}`}
											style={{
												backgroundColor: "#fef3c7",
												borderColor: "#fbbf24",
											}}>
											<input
												type="checkbox"
												checked={isActive}
												onChange={() => toggleField("lineItems", null, agg.id)}
												className="field-checkbox"
											/>
											{isEditing ? (
												<input
													type="text"
													value={editingValue}
													onChange={(e) => setEditingValue(e.target.value)}
													onBlur={() => {
														setTemplate((prev) => ({
															...prev,
															aggregations: prev.aggregations.map((a) =>
																a.id === agg.id
																	? {
																			...a,
																			label: editingValue.trim() || agg.label,
																	  }
																	: a
															),
														}));
														setEditingField(null);
														setEditingValue("");
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															setTemplate((prev) => ({
																...prev,
																aggregations: prev.aggregations.map((a) =>
																	a.id === agg.id
																		? {
																				...a,
																				label: editingValue.trim() || agg.label,
																		  }
																		: a
																),
															}));
															setEditingField(null);
															setEditingValue("");
														} else if (e.key === "Escape") {
															setEditingField(null);
															setEditingValue("");
														}
													}}
													autoFocus
													className="field-label-input"
													style={{
														flex: 1,
														padding: "0.25rem",
														border: "1px solid #2563eb",
														borderRadius: "0.25rem",
														fontSize: "0.875rem",
														color: "#000000",
														backgroundColor: "#ffffff",
													}}
												/>
											) : (
												<span
													className="field-label"
													onClick={() => {
														setEditingField(agg.id);
														setEditingValue(agg.label);
													}}
													style={{ cursor: "pointer" }}>
													{agg.label} (
													{agg.fields.map((f) => getColumnLabel(f)).join(" + ")}
													)
												</span>
											)}
											{isActive && (
												<div className="field-controls">
													<button
														onClick={() => removeAggregation(agg.id)}
														className="field-control-button"
														title="Remove aggregation">
														<Trash2 size={14} />
													</button>
													<button
														onClick={() =>
															moveField("lineItems", null, agg.id, "up")
														}
														disabled={index === 0}
														className="field-control-button">
														<ChevronUp size={14} />
													</button>
													<button
														onClick={() =>
															moveField("lineItems", null, agg.id, "down")
														}
														disabled={index === template.lineItems.length - 1}
														className="field-control-button">
														<ChevronDown size={14} />
													</button>
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Summary Section */}
					<div className="section-container">
						<button
							onClick={() => toggleSection("summary")}
							className="section-button">
							<span className="section-title">Summary Fields</span>
							{expandedSections.summary ? (
								<ChevronUp size={20} />
							) : (
								<ChevronDown size={20} />
							)}
						</button>
						{expandedSections.summary && (
							<div className="section-content-spaced-sm">
								{AVAILABLE_FIELDS.summary.map((field) => {
									const isActive = template.summary.includes(field.id);
									const index = template.summary.indexOf(field.id);
									return (
										<div
											key={field.id}
											className={`field-item ${
												isActive ? "field-item-active" : "field-item-inactive"
											}`}>
											<input
												type="checkbox"
												checked={isActive}
												onChange={() => toggleField("summary", null, field.id)}
												className="field-checkbox"
											/>
											<span className="field-label">{field.label}</span>
											{isActive && (
												<div className="field-controls">
													<button
														onClick={() =>
															moveField("summary", null, field.id, "up")
														}
														disabled={index === 0}
														className="field-control-button">
														<ChevronUp size={14} />
													</button>
													<button
														onClick={() =>
															moveField("summary", null, field.id, "down")
														}
														disabled={index === template.summary.length - 1}
														className="field-control-button">
														<ChevronDown size={14} />
													</button>
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Settings */}
					<div className="settings-container">
						<div className="settings-group">
							<label className="settings-label">Summary Layout</label>
							<select
								value={template.summaryLayout}
								onChange={(e) =>
									setTemplate((prev) => ({
										...prev,
										summaryLayout: e.target.value,
									}))
								}
								className="settings-select">
								<option value="split">Split (Summary + Sign Area)</option>
								<option value="full">Full Width Summary</option>
							</select>
						</div>
						<div className="settings-group">
							<label className="settings-label">Font Size</label>
							<input
								type="range"
								min="7"
								max="12"
								value={template.fontSize}
								onChange={(e) =>
									setTemplate((prev) => ({
										...prev,
										fontSize: parseInt(e.target.value),
									}))
								}
								className="settings-range"
							/>
							<div className="settings-range-value">{template.fontSize}px</div>
						</div>
						<div className="settings-checkbox-group">
							<input
								type="checkbox"
								checked={template.showTableBorders}
								onChange={(e) =>
									setTemplate((prev) => ({
										...prev,
										showTableBorders: e.target.checked,
									}))
								}
								className="settings-checkbox"
							/>
							<label className="settings-checkbox-label">
								Show Table Borders
							</label>
						</div>
					</div>
				</div>

				<div className="save-container">
					<button onClick={saveTemplate} className="save-button">
						<Save size={18} />
						Save Template
					</button>
				</div>
			</div>

			{/* Aggregation Modal */}
			{showAggregationModal && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1000,
					}}
					onClick={() => setShowAggregationModal(false)}>
					<div
						style={{
							backgroundColor: "white",
							padding: "1.5rem",
							borderRadius: "0.5rem",
							minWidth: "400px",
							maxWidth: "600px",
						}}
						onClick={(e) => e.stopPropagation()}>
						<h3 style={{ marginBottom: "1rem", fontWeight: 600 }}>
							Create Aggregation
						</h3>
						<div style={{ marginBottom: "1rem" }}>
							<label
								style={{
									display: "block",
									marginBottom: "0.5rem",
									fontWeight: 500,
								}}>
								Label:
							</label>
							<input
								type="text"
								value={aggregationLabel}
								onChange={(e) => setAggregationLabel(e.target.value)}
								placeholder="e.g., Total Tax"
								style={{
									width: "100%",
									padding: "0.5rem",
									border: "1px solid #e5e7eb",
									borderRadius: "0.25rem",
								}}
							/>
						</div>
						<div style={{ marginBottom: "1rem" }}>
							<label
								style={{
									display: "block",
									marginBottom: "0.5rem",
									fontWeight: 500,
								}}>
								Fields to aggregate:
							</label>
							<div
								style={{
									maxHeight: "200px",
									overflowY: "auto",
									border: "1px solid #e5e7eb",
									borderRadius: "0.25rem",
									padding: "0.5rem",
								}}>
								{AVAILABLE_FIELDS.lineItems
									.filter(
										(f) =>
											f.type === "number" && !isFieldReplacedByAggregation(f.id)
									)
									.map((field) => (
										<label
											key={field.id}
											style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
												padding: "0.25rem",
												cursor: "pointer",
											}}>
											<input
												type="checkbox"
												checked={aggregationFields.includes(field.id)}
												onChange={(e) => {
													if (e.target.checked) {
														setAggregationFields([
															...aggregationFields,
															field.id,
														]);
													} else {
														setAggregationFields(
															aggregationFields.filter((f) => f !== field.id)
														);
													}
												}}
											/>
											<span>{getColumnLabel(field.id)}</span>
										</label>
									))}
							</div>
						</div>
						<div style={{ marginBottom: "1rem" }}>
							<label
								style={{
									display: "block",
									marginBottom: "0.5rem",
									fontWeight: 500,
								}}>
								Type:
							</label>
							<select
								value={aggregationType}
								onChange={(e) => setAggregationType(e.target.value)}
								style={{
									width: "100%",
									padding: "0.5rem",
									border: "1px solid #e5e7eb",
									borderRadius: "0.25rem",
								}}>
								<option value="add">Add as new column</option>
								<option value="replace">Replace selected columns</option>
							</select>
						</div>
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								justifyContent: "flex-end",
							}}>
							<button
								onClick={() => setShowAggregationModal(false)}
								style={{
									padding: "0.5rem 1rem",
									border: "1px solid #e5e7eb",
									borderRadius: "0.25rem",
									backgroundColor: "white",
									cursor: "pointer",
								}}>
								Cancel
							</button>
							<button
								onClick={() => {
									if (aggregationFields.length > 0 && aggregationLabel.trim()) {
										addAggregation(
											aggregationFields,
											aggregationLabel.trim(),
											aggregationType
										);
										setShowAggregationModal(false);
										setAggregationFields([]);
										setAggregationLabel("");
										setAggregationType("add");
										setSelectedFieldForAggregation(null);
									}
								}}
								disabled={
									aggregationFields.length === 0 || !aggregationLabel.trim()
								}
								style={{
									padding: "0.5rem 1rem",
									border: "none",
									borderRadius: "0.25rem",
									backgroundColor:
										aggregationFields.length > 0 && aggregationLabel.trim()
											? "#2563eb"
											: "#9ca3af",
									color: "white",
									cursor:
										aggregationFields.length > 0 && aggregationLabel.trim()
											? "pointer"
											: "not-allowed",
								}}>
								Create
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Preview Panel */}
			<div className="preview-container">
				{/* Toolbar */}
				<div className="toolbar">
					<div className="toolbar-group">
						<button
							onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
							className={`toolbar-button ${
								mode === "edit"
									? "toolbar-button-active"
									: "toolbar-button-inactive"
							}`}>
							<Edit size={18} />
							Edit
						</button>
						<button
							onClick={() => setMode("preview")}
							className={`toolbar-button ${
								mode === "preview"
									? "toolbar-button-active"
									: "toolbar-button-inactive"
							}`}>
							<Eye size={18} />
							Preview
						</button>
					</div>
					<button onClick={handlePrint} className="toolbar-button-print">
						Print / PDF
					</button>
				</div>

				{/* Invoice Preview */}
				<div className="preview-content">
					<div
						ref={printRef}
						className="invoice-paper"
						style={{
							width: PAPER_SIZES[paperSize].width,
							minHeight: PAPER_SIZES[paperSize].height,
							padding: `${calculatePadding(paperSize)}mm`,
							fontSize: `${template.fontSize}px`,
						}}>
						{/* Top Border */}
						<div className="invoice-top-border">
							<div className="invoice-top-content">
								<div className="invoice-top-center">
									{template.header.topRow.map((fieldId, idx) => (
										<span key={fieldId}>
											{idx > 0 && <span className="invoice-top-spacer"></span>}
											{PLACEHOLDER_DATA.header[fieldId]}
										</span>
									))}
								</div>
							</div>
						</div>

						{/* Header Info */}
						<div className="invoice-header-section">
							<div className="invoice-header-grid">
								{/* Left Column */}
								<div className="invoice-header-column">
									{template.header.left.map((fieldId) => {
										const field = AVAILABLE_FIELDS.header.left.find(
											(f) => f.id === fieldId
										);
										return (
											<div key={fieldId} className="invoice-header-field">
												<span className="invoice-header-label">
													{field.label}:{" "}
												</span>
												<span>{PLACEHOLDER_DATA.header[fieldId]}</span>
											</div>
										);
									})}
								</div>

								{/* Right Column */}
								<div className="invoice-header-column invoice-header-column-right">
									{template.header.right.map((fieldId) => {
										const field = AVAILABLE_FIELDS.header.right.find(
											(f) => f.id === fieldId
										);
										return (
											<div key={fieldId} className="invoice-header-field">
												<span className="invoice-header-label">
													{field.label}:{" "}
												</span>
												<span>{PLACEHOLDER_DATA.header[fieldId]}</span>
											</div>
										);
									})}
								</div>
							</div>
						</div>

						{/* Line Items - Table Style */}
						<div className="invoice-table-section">
							<table className="invoice-table">
								<thead>
									<tr className="invoice-table-header">
										{(() => {
											const cellPadding = calculateCellPadding(paperSize);
											return (
												<>
													<th
														className={`invoice-table-header-cell ${
															template.showTableBorders
																? "invoice-table-header-cell-bordered"
																: ""
														}`}
														style={{
															width: columnWidths.index
																? `${columnWidths.index}px`
																: undefined,
															padding: `${cellPadding / 16}rem`,
														}}>
														#
													</th>
													{template.lineItems.includes("sku") && (
														<th
															className={`invoice-table-header-cell ${
																template.showTableBorders
																	? "invoice-table-header-cell-bordered"
																	: ""
															}`}
															style={{
																width: columnWidths.sku
																	? `${columnWidths.sku}px`
																	: undefined,
																padding: `${cellPadding / 16}rem`,
															}}>
															{getColumnLabel("sku")}
														</th>
													)}
													{template.lineItems
														.filter((f) => f !== "sku")
														.map((fieldId) => {
															const aggregation =
																getAggregationForColumn(fieldId);
															const field = aggregation
																? null
																: AVAILABLE_FIELDS.lineItems.find(
																		(f) => f.id === fieldId
																  );
															const label = aggregation
																? aggregation.label
																: getColumnLabel(fieldId);
															return (
																<th
																	key={fieldId}
																	className={`invoice-table-header-cell invoice-table-header-cell-right ${
																		template.showTableBorders
																			? "invoice-table-header-cell-bordered"
																			: ""
																	}`}
																	style={{
																		width: columnWidths[fieldId]
																			? `${columnWidths[fieldId]}px`
																			: undefined,
																		padding: `${cellPadding / 16}rem`,
																	}}>
																	{label}
																</th>
															);
														})}
												</>
											);
										})()}
									</tr>
								</thead>
								<tbody>
									{PLACEHOLDER_DATA.lineItems.map((item, idx) => (
										<tr
											key={idx}
											className={
												template.showTableBorders ? "" : "invoice-table-row"
											}>
											{(() => {
												const cellPadding = calculateCellPadding(paperSize);
												return (
													<>
														<td
															className={`invoice-table-cell ${
																template.showTableBorders
																	? "invoice-table-cell-bordered"
																	: ""
															}`}
															style={{
																width: columnWidths.index
																	? `${columnWidths.index}px`
																	: undefined,
																padding: `${cellPadding / 16}rem`,
															}}>
															{idx + 1}.
														</td>
														{template.lineItems.includes("sku") && (
															<td
																className={`invoice-table-cell invoice-sku-cell ${
																	template.showTableBorders
																		? "invoice-table-cell-bordered"
																		: ""
																}`}
																style={{
																	width: columnWidths.sku
																		? `${columnWidths.sku}px`
																		: undefined,
																	padding: `${cellPadding / 16}rem`,
																}}>
																<div className="invoice-sku-name">
																	{item.sku}
																</div>
																{template.showCtSize && item.ctSize && (
																	<div className="invoice-sku-size">
																		* Ct.Size ({item.ctSize})
																	</div>
																)}
																{template.showBarcode && item.barcode && (
																	<div className="invoice-sku-size">
																		* Barcode ({item.barcode})
																	</div>
																)}
															</td>
														)}
													</>
												);
											})()}
											{template.lineItems
												.filter((f) => f !== "sku")
												.map((fieldId) => {
													const aggregation = getAggregationForColumn(fieldId);
													const field = aggregation
														? null
														: AVAILABLE_FIELDS.lineItems.find(
																(f) => f.id === fieldId
														  );
													const cellPadding = calculateCellPadding(paperSize);
													let value;
													let displayValue;

													if (aggregation) {
														value = calculateAggregatedValue(item, aggregation);
														displayValue =
															typeof value === "number"
																? value.toFixed(2)
																: "0.00";
													} else {
														value = item[fieldId];
														displayValue =
															field.type === "number"
																? typeof value === "number"
																	? value.toFixed(2)
																	: "0.00"
																: value;
													}

													return (
														<td
															key={fieldId}
															className={`invoice-table-cell invoice-table-cell-right ${
																template.showTableBorders
																	? "invoice-table-cell-bordered"
																	: ""
															}`}
															style={{
																width: columnWidths[fieldId]
																	? `${columnWidths[fieldId]}px`
																	: undefined,
																padding: `${cellPadding / 16}rem`,
															}}>
															{displayValue}
														</td>
													);
												})}
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Summary */}
						<div className="invoice-summary-section">
							{template.summaryLayout === "split" ? (
								// Split Layout: Summary on left, Sign area on right
								<div className="invoice-summary-grid">
									{/* Left: Summary */}
									<div>
										<table className="invoice-summary-table">
											<tbody>
												{template.summary.map((fieldId) => {
													const field = AVAILABLE_FIELDS.summary.find(
														(f) => f.id === fieldId
													);
													const value = PLACEHOLDER_DATA.summary[fieldId];
													return (
														<tr key={fieldId} className="invoice-summary-row">
															<td className="invoice-summary-label">
																{field.label}
															</td>
															<td className="invoice-summary-value">
																{typeof value === "number"
																	? value.toFixed(2)
																	: value}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>

									{/* Right: Sign & Stamp Area */}
									<div className="invoice-sign-area">
										<div className="invoice-sign-content">
											<div className="invoice-sign-title">Sign & Stamp</div>
											<div className="invoice-sign-date">
												printed on: {new Date().toISOString().split("T")[0]}
											</div>
										</div>
									</div>
								</div>
							) : (
								// Full Width Layout: Summary only
								<div>
									<table className="invoice-summary-table">
										<tbody>
											{template.summary.map((fieldId) => {
												const field = AVAILABLE_FIELDS.summary.find(
													(f) => f.id === fieldId
												);
												const value = PLACEHOLDER_DATA.summary[fieldId];
												return (
													<tr key={fieldId} className="invoice-summary-row">
														<td className="invoice-summary-label">
															{field.label}
														</td>
														<td className="invoice-summary-value">
															{typeof value === "number"
																? value.toFixed(2)
																: value}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
									<div className="invoice-summary-full">
										<div className="invoice-sign-title">Sign & Stamp</div>
										<div className="invoice-sign-date invoice-sign-date-inline">
											printed on: {new Date().toISOString().split("T")[0]}
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Footer - Removed as sign & stamp is now in summary */}
					</div>
				</div>
			</div>
		</div>
	);
};

export default InvoiceTemplateCreator;
