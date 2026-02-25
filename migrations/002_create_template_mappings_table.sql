-- Create template_mappings table
CREATE TABLE IF NOT EXISTS template_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    section VARCHAR(50) NOT NULL COMMENT 'Section type: header, lineItems, summary, notes',
    template_field VARCHAR(100) NOT NULL COMMENT 'Field name in template (e.g., companyName, sku)',
    api_field_path VARCHAR(255) NOT NULL COMMENT 'API response path (e.g., distributor.name, itemName)',
    custom_label VARCHAR(255) COMMENT 'Optional custom label override',
    field_order INT NOT NULL DEFAULT 0 COMMENT 'Display order within section',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_template_id (template_id),
    INDEX idx_section (section),
    INDEX idx_template_section_order (template_id, section, field_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment
ALTER TABLE template_mappings COMMENT = 'Stores field mappings from API response to template fields';
