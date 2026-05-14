-- ============================================
-- Smart ERP Next - Performance Indexes
-- Additional indexes for frequently queried columns
-- ============================================

-- Approval requests indexes
CREATE INDEX IF NOT EXISTS approval_requests_tenant_idx ON approval_requests(tenant_id);
CREATE INDEX IF NOT EXISTS approval_requests_status_idx ON approval_requests(status);
CREATE INDEX IF NOT EXISTS approval_requests_document_idx ON approval_requests(document_type, document_id);
CREATE INDEX IF NOT EXISTS approval_requests_created_idx ON approval_requests(created_at DESC);

-- Approval chain items indexes
CREATE INDEX IF NOT EXISTS approval_chain_items_request_idx ON approval_chain_items(request_id);
CREATE INDEX IF NOT EXISTS approval_chain_items_approver_idx ON approval_chain_items(approver_id);

-- Activity logs indexes (for dashboard queries)
CREATE INDEX IF NOT EXISTS activity_logs_tenant_idx ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_entity_idx ON activity_logs(entity_type, entity_id);

-- Inventory transactions indexes (for reporting)
CREATE INDEX IF NOT EXISTS inventory_transactions_warehouse_idx ON inventory_transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_product_idx ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_created_idx ON inventory_transactions(created_at DESC);

-- Composite index for dashboard KPI queries
CREATE INDEX IF NOT EXISTS orders_dashboard_idx ON orders(tenant_id, status, created_at DESC)
  WHERE status != 'cancelled';

-- Users indexes for auth queries
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users(tenant_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
