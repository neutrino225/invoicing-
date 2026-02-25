-- Additional composite indexes for common query patterns
-- (These may already be covered above, but included for completeness)

-- For querying templates by status
CREATE INDEX idx_status_default ON templates(status, is_default);

-- For querying mappings by template and section
CREATE INDEX idx_template_section ON template_mappings(template_id, section);
