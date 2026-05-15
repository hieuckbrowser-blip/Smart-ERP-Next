-- MRP (Material Requirements Planning) Engine
-- Net requirements calculation from forecast, sales orders, and BOM

CREATE TABLE IF NOT EXISTS mrp_forecasts (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  forecasted_demand INTEGER DEFAULT 0,
  sales_order_demand INTEGER DEFAULT 0,
  net_requirement INTEGER DEFAULT 0,
  suggested_production INTEGER DEFAULT 0,
  raw_material_gap INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, product_id, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_mrp_forecasts_tenant ON mrp_forecasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mrp_forecasts_product ON mrp_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_mrp_forecasts_date ON mrp_forecasts(tenant_id, forecast_date);