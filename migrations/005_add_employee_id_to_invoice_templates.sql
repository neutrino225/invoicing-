-- Add employee_id column to invoice_templates table
-- This makes templates employee-specific so every employee in a company can have their own invoice templates
ALTER TABLE invoice_templates
    ADD COLUMN employee_id INT NULL AFTER id,
    ADD INDEX idx_employee_id (employee_id),
    ADD INDEX idx_employee_status (employee_id, status);

-- Update existing templates: set employee_id to NULL (shared/global templates)
-- These can be migrated to specific employees as needed
