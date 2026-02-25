import React, { useState, useEffect } from "react";
import { Trash2, Edit, Eye, Star, StarOff, Plus } from "lucide-react";
import {
	fetchTemplates,
	deleteTemplate,
	setDefaultTemplate,
} from "../api/templateApi";

const TemplateManager = ({
	isOpen,
	onClose,
	onSelectTemplate,
	onEditTemplate,
}) => {
	const [templates, setTemplates] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (isOpen) {
			loadTemplates();
		}
	}, [isOpen]);

	const loadTemplates = async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await fetchTemplates();
			setTemplates(data);
		} catch (err) {
			console.error("Error loading templates:", err);
			setError("Failed to load templates");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (templateId, templateName) => {
		if (!window.confirm(`Are you sure you want to delete template "${templateName}"?`)) {
			return;
		}

		try {
			await deleteTemplate(templateId);
			await loadTemplates();
		} catch (err) {
			console.error("Error deleting template:", err);
			alert("Failed to delete template");
		}
	};

	const handleSetDefault = async (templateId) => {
		try {
			await setDefaultTemplate(templateId);
			await loadTemplates();
		} catch (err) {
			console.error("Error setting default template:", err);
			alert("Failed to set default template");
		}
	};

	if (!isOpen) return null;

	return (
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
			onClick={onClose}>
			<div
				style={{
					backgroundColor: "white",
					padding: "1.5rem",
					borderRadius: "0.5rem",
					minWidth: "600px",
					maxWidth: "800px",
					width: "90%",
					maxHeight: "80vh",
					overflow: "auto",
					boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
				}}
				onClick={(e) => e.stopPropagation()}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "1.5rem",
					}}>
					<h2
						style={{
							margin: 0,
							fontWeight: 600,
							fontSize: "1.5rem",
							color: "#000000",
						}}>
						Template Manager
					</h2>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: "0.25rem",
							fontSize: "1.5rem",
							color: "#6b7280",
						}}>
						×
					</button>
				</div>

				{loading && (
					<div
						style={{
							textAlign: "center",
							padding: "2rem",
							color: "#6b7280",
						}}>
						Loading templates...
					</div>
				)}

				{error && (
					<div
						style={{
							padding: "1rem",
							backgroundColor: "#fef2f2",
							border: "1px solid #fecaca",
							borderRadius: "0.25rem",
							color: "#991b1b",
							marginBottom: "1rem",
						}}>
						{error}
					</div>
				)}

				{!loading && !error && (
					<>
						{templates.length === 0 ? (
							<div
								style={{
									textAlign: "center",
									padding: "2rem",
									color: "#6b7280",
								}}>
								<p>No templates found. Create your first template!</p>
							</div>
						) : (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "0.75rem",
								}}>
								{templates.map((template) => (
									<div
										key={template.id}
										style={{
											border: "1px solid #e5e7eb",
											borderRadius: "0.5rem",
											padding: "1rem",
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											backgroundColor: template.is_default ? "#fef3c7" : "white",
										}}>
										<div style={{ flex: 1 }}>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
													marginBottom: "0.25rem",
												}}>
												<h3
													style={{
														margin: 0,
														fontWeight: 600,
														fontSize: "1rem",
														color: "#000000",
													}}>
													{template.name}
													{template.is_default && (
														<span
															style={{
																marginLeft: "0.5rem",
																fontSize: "0.75rem",
																color: "#f59e0b",
																fontWeight: 500,
															}}>
															(Default)
														</span>
													)}
												</h3>
											</div>
											{template.description && (
												<p
													style={{
														margin: 0,
														fontSize: "0.875rem",
														color: "#6b7280",
													}}>
													{template.description}
												</p>
											)}
											<div
												style={{
													marginTop: "0.5rem",
													fontSize: "0.75rem",
													color: "#9ca3af",
												}}>
												Status: {template.status || "active"}
											</div>
										</div>
										<div
											style={{
												display: "flex",
												gap: "0.5rem",
												alignItems: "center",
											}}>
											<button
												onClick={() => onSelectTemplate(template.id)}
												title="Use this template"
												style={{
													padding: "0.5rem",
													border: "1px solid #e5e7eb",
													borderRadius: "0.25rem",
													backgroundColor: "white",
													cursor: "pointer",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}>
												<Eye size={18} color="#2563eb" />
											</button>
											<button
												onClick={() => onEditTemplate(template.id)}
												title="Edit template"
												style={{
													padding: "0.5rem",
													border: "1px solid #e5e7eb",
													borderRadius: "0.25rem",
													backgroundColor: "white",
													cursor: "pointer",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}>
												<Edit size={18} color="#2563eb" />
											</button>
											{!template.is_default && (
												<button
													onClick={() => handleSetDefault(template.id)}
													title="Set as default"
													style={{
														padding: "0.5rem",
														border: "1px solid #e5e7eb",
														borderRadius: "0.25rem",
														backgroundColor: "white",
														cursor: "pointer",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}>
													<Star size={18} color="#f59e0b" />
												</button>
											)}
											<button
												onClick={() => handleDelete(template.id, template.name)}
												title="Delete template"
												style={{
													padding: "0.5rem",
													border: "1px solid #e5e7eb",
													borderRadius: "0.25rem",
													backgroundColor: "white",
													cursor: "pointer",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}>
												<Trash2 size={18} color="#ef4444" />
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default TemplateManager;
