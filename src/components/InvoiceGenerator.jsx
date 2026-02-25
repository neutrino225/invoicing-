import React, { useState, useEffect, useRef } from "react";
import { Printer, Download, Loader2, AlertCircle } from "lucide-react";
import { fetchTemplates, fetchTemplate } from "../api/templateApi";
import { fetchInvoiceData } from "../api/invoiceApi";
import { transformApiDataToTemplate } from "../utils/dataTransformer";
import { renderTemplate, convertMustacheToPlaceholder } from "../utils/templateEngine";
import "../invoiceGenerator.css";

/**
 * Simplified Invoice Generator Component
 * 
 * This component allows users to:
 * 1. Select a saved template
 * 2. Enter an order ID
 * 3. Generate and view the invoice
 * 4. Print or export as PDF
 */
const InvoiceGenerator = () => {
	const [templates, setTemplates] = useState([]);
	const [selectedTemplateId, setSelectedTemplateId] = useState(null);
	const [orderId, setOrderId] = useState("");
	const [baseUrl, setBaseUrl] = useState("https://targetslive.co/apikt");
	
	const [loading, setLoading] = useState(false);
	const [templatesLoading, setTemplatesLoading] = useState(true);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState(null);
	
	const [renderedHtml, setRenderedHtml] = useState(null);
	const [invoiceData, setInvoiceData] = useState(null);
	const [paperSize, setPaperSize] = useState("A4"); // Paper size from template
	const printRef = useRef(null);

	// Load templates on mount
	useEffect(() => {
		const loadTemplates = async () => {
			setTemplatesLoading(true);
			try {
				const fetchedTemplates = await fetchTemplates();
				setTemplates(fetchedTemplates);
				
				// Set default template if available
				const defaultTemplate = fetchedTemplates.find((t) => t.is_default);
				if (defaultTemplate) {
					setSelectedTemplateId(defaultTemplate.id);
				} else if (fetchedTemplates.length > 0) {
					setSelectedTemplateId(fetchedTemplates[0].id);
				}
			} catch (err) {
				console.error("Failed to load templates:", err);
				setError("Failed to load templates. Please refresh the page.");
			} finally {
				setTemplatesLoading(false);
			}
		};

		loadTemplates();
	}, []);

	// Generate invoice
	const handleGenerateInvoice = async () => {
		if (!selectedTemplateId) {
			setError("Please select a template");
			return;
		}

		if (!orderId.trim()) {
			setError("Please enter an order ID");
			return;
		}

		setGenerating(true);
		setError(null);
		setRenderedHtml(null);

		try {
			// 1. Fetch template with mappings and aggregations
			const template = await fetchTemplate(selectedTemplateId);

			// 2. Fetch invoice data from API
			const apiData = await fetchInvoiceData(parseInt(orderId), baseUrl);

			// 3. Normalize aggregations - create a map from template config IDs to DB aggregation_ids
			// The template HTML uses IDs from template_config.lineItems, but DB has aggregation_id
			const templateConfig = template.template_config || {};
			const templateAggregations = templateConfig.aggregations || [];
			const dbAggregations = template.aggregations || [];
			
			// Create a mapping: template ID -> DB aggregation
			const aggregationMap = new Map();
			templateAggregations.forEach((templateAgg) => {
				// Find matching DB aggregation by label and fields
				const dbAgg = dbAggregations.find(
					(da) =>
						da.label === templateAgg.label &&
						JSON.stringify(da.fields) === JSON.stringify(templateAgg.fields)
				);
				if (dbAgg) {
					aggregationMap.set(templateAgg.id, dbAgg);
				}
			});

			// Create normalized aggregations with both id (from template) and aggregation_id (from DB)
			const normalizedAggregations = templateAggregations.map((templateAgg) => {
				const dbAgg = aggregationMap.get(templateAgg.id);
				return {
					id: templateAgg.id, // Use template ID (this is what's in lineItems and HTML)
					aggregation_id: dbAgg?.aggregation_id || templateAgg.id,
					label: templateAgg.label || dbAgg?.label,
					fields: templateAgg.fields || dbAgg?.fields || [],
					type: templateAgg.type || dbAgg?.type || "add",
				};
			});

			// 4. Transform API data using template mappings
			const transformedData = transformApiDataToTemplate(
				apiData,
				template.mappings || [],
				normalizedAggregations
			);

			// 5. Fix template HTML syntax errors (missing closing quotes in table cells)
			// This fixes a bug where table cells have: class="...invoice-table-cell-right>[field]"
			// Should be: class="...invoice-table-cell-right">[field]
			let fixedHtml = template.html.replace(/invoice-table-cell-right>\[/g, 'invoice-table-cell-right">[');

			// 6. Convert Mustache syntax to [PLACEHOLDER] syntax (for backward compatibility with existing templates)
			const convertedHtml = convertMustacheToPlaceholder(fixedHtml);

			// 7. Render HTML using our template engine
			const html = renderTemplate(convertedHtml, transformedData);

			setRenderedHtml(html);
			setInvoiceData(apiData);
		} catch (err) {
			console.error("Failed to generate invoice:", err);
			setError(
				err.response?.data?.message ||
				err.message ||
				"Failed to generate invoice. Please check the order ID and try again."
			);
		} finally {
			setGenerating(false);
		}
	};

	// Handle print
	const handlePrint = () => {
		if (!renderedHtml) return;
		window.print();
	};

	// Handle PDF export (requires html2canvas and jspdf)
	const handleExportPDF = async () => {
		if (!renderedHtml) return;
		
		// Note: This requires html2canvas and jspdf packages
		// Uncomment and install packages to enable PDF export
		/*
		try {
			const html2canvas = (await import('html2canvas')).default;
			const jsPDF = (await import('jspdf')).default;
			
			const element = printRef.current;
			const canvas = await html2canvas(element, {
				scale: 2,
				useCORS: true,
			});
			
			const imgData = canvas.toDataURL('image/png');
			
			// Determine PDF page size based on template paper size
			const PAPER_DIMENSIONS = {
				A4: { width: 210, height: 297 },
				A5: { width: 148, height: 210 },
				Letter: { width: 215.9, height: 279.4 },
			};
			const dimensions = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.A4;
			const pdfSize = paperSize === "A5" ? "a5" : paperSize === "Letter" ? "letter" : "a4";
			
			const pdf = new jsPDF('p', 'mm', pdfSize);
			const imgWidth = dimensions.width;
			const pageHeight = dimensions.height;
			const imgHeight = (canvas.height * imgWidth) / canvas.width;
			let heightLeft = imgHeight;
			let position = 0;
			
			pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
			heightLeft -= pageHeight;
			
			while (heightLeft >= 0) {
				position = heightLeft - imgHeight;
				pdf.addPage();
				pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
				heightLeft -= pageHeight;
			}
			
			pdf.save(`invoice-${orderId}.pdf`);
		} catch (err) {
			console.error("Failed to export PDF:", err);
			alert("PDF export failed. Please try printing instead.");
		}
		*/
		
		alert("PDF export requires html2canvas and jspdf packages. Please use Print instead.");
	};

	return (
		<div className="invoice-container" style={{ flexDirection: "column" }}>
			{/* Header/Controls - Hidden when printing */}
			<div
				className="invoice-controls"
				style={{
					backgroundColor: "white",
					borderBottom: "1px solid #e5e7eb",
					padding: "1rem",
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
				}}>
				<h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "#000000" }}>
					Generate Invoice
				</h1>

				<div
					style={{
						display: "flex",
						gap: "1rem",
						alignItems: "flex-end",
						flexWrap: "wrap",
					}}>
					{/* Template Selection */}
					<div style={{ flex: 1, minWidth: "200px" }}>
						<label
							style={{
								display: "block",
								marginBottom: "0.5rem",
								fontSize: "0.875rem",
								fontWeight: 500,
								color: "#000000",
							}}>
							Template
						</label>
						<select
							value={selectedTemplateId || ""}
							onChange={(e) => setSelectedTemplateId(e.target.value ? parseInt(e.target.value) : null)}
							disabled={templatesLoading}
							style={{
								width: "100%",
								padding: "0.5rem",
								border: "1px solid #e5e7eb",
								borderRadius: "0.25rem",
								backgroundColor: templatesLoading ? "#f3f4f6" : "white",
								color: templatesLoading ? "#9ca3af" : "#000000",
								fontSize: "0.875rem",
								cursor: templatesLoading ? "not-allowed" : "pointer",
							}}>
							<option value="">
								{templatesLoading ? "Loading templates..." : "Select template"}
							</option>
							{templates.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name} {t.is_default ? "(Default)" : ""}
								</option>
							))}
						</select>
					</div>

					{/* Order ID Input */}
					<div style={{ flex: 1, minWidth: "200px" }}>
						<label
							style={{
								display: "block",
								marginBottom: "0.5rem",
								fontSize: "0.875rem",
								fontWeight: 500,
								color: "#000000",
							}}>
							Order ID *
						</label>
						<input
							type="number"
							value={orderId}
							onChange={(e) => setOrderId(e.target.value)}
							placeholder="Enter order ID"
							disabled={generating}
							style={{
								width: "100%",
								padding: "0.5rem",
								border: "1px solid #e5e7eb",
								borderRadius: "0.25rem",
								fontSize: "0.875rem",
								color: "#000000",
								backgroundColor: generating ? "#f3f4f6" : "white",
							}}
							onKeyPress={(e) => {
								if (e.key === "Enter") {
									handleGenerateInvoice();
								}
							}}
						/>
					</div>

					{/* Base URL Input (Optional) */}
					<div style={{ flex: 1, minWidth: "200px" }}>
						<label
							style={{
								display: "block",
								marginBottom: "0.5rem",
								fontSize: "0.875rem",
								fontWeight: 500,
								color: "#000000",
							}}>
							Base URL (Optional)
						</label>
						<input
							type="text"
							value={baseUrl}
							onChange={(e) => setBaseUrl(e.target.value)}
							placeholder="https://targetslive.co/apikt"
							disabled={generating}
							style={{
								width: "100%",
								padding: "0.5rem",
								border: "1px solid #e5e7eb",
								borderRadius: "0.25rem",
								fontSize: "0.875rem",
								color: "#000000",
								backgroundColor: generating ? "#f3f4f6" : "white",
							}}
						/>
					</div>

					{/* Generate Button */}
					<button
						onClick={handleGenerateInvoice}
						disabled={generating || !selectedTemplateId || !orderId.trim()}
						style={{
							padding: "0.5rem 1.5rem",
							backgroundColor:
								generating || !selectedTemplateId || !orderId.trim() ? "#9ca3af" : "#21b464",
							color: "white",
							border: "none",
							borderRadius: "0.25rem",
							fontSize: "0.875rem",
							fontWeight: 600,
							cursor:
								generating || !selectedTemplateId || !orderId.trim() ? "not-allowed" : "pointer",
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
							transition: "background-color 0.2s ease",
						}}>
						{generating ? (
							<>
								<Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
								Generating...
							</>
						) : (
							"Generate Invoice"
						)}
					</button>
				</div>

				{/* Error Message */}
				{error && (
					<div
						style={{
							padding: "0.75rem",
							backgroundColor: "#fef2f2",
							border: "1px solid #fecaca",
							borderRadius: "0.25rem",
							color: "#991b1b",
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
							fontSize: "0.875rem",
						}}>
						<AlertCircle size={18} />
						{error}
					</div>
				)}
			</div>

			{/* Invoice Preview/Display */}
			<div className="preview-content" style={{ flex: 1, overflow: "auto" }}>
				{renderedHtml ? (
					<div style={{ position: "relative" }}>
						{/* Action Buttons - Hidden when printing */}
						<div
							className="invoice-action-buttons"
							style={{
								position: "sticky",
								top: 0,
								backgroundColor: "white",
								padding: "1rem",
								borderBottom: "1px solid #e5e7eb",
								display: "flex",
								gap: "0.5rem",
								zIndex: 10,
								boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
							}}>
							<button
								onClick={handlePrint}
								className="toolbar-button-print"
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
								}}>
								<Printer size={18} />
								Print / PDF
							</button>
							<button
								onClick={handleExportPDF}
								style={{
									padding: "0.5rem 1rem",
									backgroundColor: "#2563eb",
									color: "white",
									border: "none",
									borderRadius: "0.25rem",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									fontSize: "0.875rem",
									fontWeight: 500,
								}}>
								<Download size={18} />
								Export PDF
							</button>
						</div>

						{/* Rendered Invoice */}
						<div
							ref={printRef}
							className="invoice-paper"
							data-paper-size={paperSize}
							dangerouslySetInnerHTML={{ __html: renderedHtml }}
						/>
					</div>
				) : (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
							color: "#6b7280",
						}}>
						<Printer size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
						<p style={{ fontSize: "1rem", margin: 0 }}>
							Select a template and enter an order ID to generate an invoice
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default InvoiceGenerator;
