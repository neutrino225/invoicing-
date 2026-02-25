-- Create template_aggregations table
CREATE TABLE IF NOT EXISTS template_aggregations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    aggregation_id VARCHAR(100) NOT NULL COMMENT 'Unique identifier for aggregation',
    label VARCHAR(255) NOT NULL COMMENT 'Display label for aggregated column',
    fields JSON NOT NULL COMMENT 'Array of field IDs to aggregate (e.g., ["tradeOffer", "slabDisc"])',
    type ENUM('add', 'replace') NOT NULL DEFAULT 'add' COMMENT 'Aggregation type',
    field_order INT NOT NULL DEFAULT 0 COMMENT 'Display order in line items',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_template_id (template_id),
    INDEX idx_aggregation_id (aggregation_id),
    INDEX idx_template_order (template_id, field_order),
    UNIQUE KEY unique_template_aggregation (template_id, aggregation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment
ALTER TABLE template_aggregations COMMENT = 'Stores aggregated column configurations for templates';
