import React, { useState } from "react";
import { X } from "lucide-react";

const TemplateSaveDialog = ({ isOpen, onClose, onSave, templateName: initialName = "" }) => {
	const [templateName, setTemplateName] = useState(initialName);
	const [description, setDescription] = useState("");
	const [isDefault, setIsDefault] = useState(false);
	const [saving, setSaving] = useState(false);

	// Update template name when dialog opens or initialName changes
	React.useEffect(() => {
		if (isOpen) {
			setTemplateName(initialName || "");
		}
	}, [isOpen, initialName]);

	const handleSave = async () => {
		if (!templateName.trim()) {
			alert("Template name is required");
			return;
		}

		setSaving(true);
		try {
			await onSave({
				name: templateName.trim(),
				description: description.trim() || null,
				is_default: isDefault,
			});
			// Reset form
			setTemplateName("");
			setDescription("");
			setIsDefault(false);
			onClose();
		} catch (error) {
			console.error("Error saving template:", error);
			alert("Failed to save template. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		setTemplateName(initialName || "");
		setDescription("");
		setIsDefault(false);
		onClose();
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
			onClick={handleCancel}>
			<div
				style={{
					backgroundColor: "white",
					padding: "1.5rem",
					borderRadius: "0.5rem",
					minWidth: "400px",
					maxWidth: "600px",
					width: "90%",
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
					<h3
						style={{
							margin: 0,
							fontWeight: 600,
							fontSize: "1.25rem",
							color: "#000000",
						}}>
						Save Template
					</h3>
					<button
						onClick={handleCancel}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: "0.25rem",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}>
						<X size={20} color="#6b7280" />
					</button>
				</div>

				<div style={{ marginBottom: "1rem" }}>
					<label
						style={{
							display: "block",
							marginBottom: "0.5rem",
							fontWeight: 500,
							color: "#000000",
						}}>
						Template Name <span style={{ color: "#ef4444" }}>*</span>
					</label>
					<input
						type="text"
						value={templateName}
						onChange={(e) => setTemplateName(e.target.value)}
						placeholder="Enter template name"
						style={{
							width: "100%",
							padding: "0.5rem",
							border: "1px solid #e5e7eb",
							borderRadius: "0.25rem",
							fontSize: "0.875rem",
							color: "#000000",
							backgroundColor: "#ffffff",
							boxSizing: "border-box",
						}}
						autoFocus
					/>
				</div>

				<div style={{ marginBottom: "1rem" }}>
					<label
						style={{
							display: "block",
							marginBottom: "0.5rem",
							fontWeight: 500,
							color: "#000000",
						}}>
						Description (Optional)
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Enter template description"
						rows={3}
						style={{
							width: "100%",
							padding: "0.5rem",
							border: "1px solid #e5e7eb",
							borderRadius: "0.25rem",
							fontSize: "0.875rem",
							color: "#000000",
							backgroundColor: "#ffffff",
							boxSizing: "border-box",
							resize: "vertical",
							fontFamily: "inherit",
						}}
					/>
				</div>

				<div style={{ marginBottom: "1.5rem" }}>
					<label
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
							cursor: "pointer",
							color: "#000000",
						}}>
						<input
							type="checkbox"
							checked={isDefault}
							onChange={(e) => setIsDefault(e.target.checked)}
							style={{
								width: "1rem",
								height: "1rem",
								cursor: "pointer",
							}}
						/>
						<span>Set as default template</span>
					</label>
				</div>

				<div
					style={{
						display: "flex",
						gap: "0.5rem",
						justifyContent: "flex-end",
					}}>
					<button
						onClick={handleCancel}
						disabled={saving}
						style={{
							padding: "0.5rem 1rem",
							border: "1px solid #e5e7eb",
							borderRadius: "0.25rem",
							backgroundColor: "white",
							color: "#000000",
							cursor: saving ? "not-allowed" : "pointer",
							fontSize: "0.875rem",
							fontWeight: 500,
						}}>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={saving || !templateName.trim()}
						style={{
							padding: "0.5rem 1rem",
							border: "none",
							borderRadius: "0.25rem",
							backgroundColor:
								saving || !templateName.trim() ? "#9ca3af" : "#21b464",
							color: "white",
							cursor: saving || !templateName.trim() ? "not-allowed" : "pointer",
							fontSize: "0.875rem",
							fontWeight: 600,
							transition: "background-color 0.2s ease",
						}}
						onMouseEnter={(e) => {
							if (!saving && templateName.trim()) {
								e.currentTarget.style.backgroundColor = "#1a8f4f";
							}
						}}
						onMouseLeave={(e) => {
							if (!saving && templateName.trim()) {
								e.currentTarget.style.backgroundColor = "#21b464";
							}
						}}>
						{saving ? "Saving..." : "Save Template"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default TemplateSaveDialog;
