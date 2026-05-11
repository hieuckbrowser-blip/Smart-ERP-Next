-- Churn risk predictions (store per customer per run)
CREATE TABLE customer_churn_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    run_date DATE NOT NULL,
    churn_probability DECIMAL(5,2) NOT NULL,   -- 0-100
    risk_segment VARCHAR(30) NOT NULL,         -- high, medium, low
    days_since_last_purchase INTEGER NOT NULL,
    total_spent DECIMAL(15,2) NOT NULL,
    purchase_frequency DECIMAL(8,2) NOT NULL,
    model_version VARCHAR(20) DEFAULT 'v1',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, customer_id, run_date)
);

CREATE INDEX idx_churn_tenant_run ON customer_churn_predictions(tenant_id, run_date);
CREATE INDEX idx_churn_customer ON customer_churn_predictions(customer_id);
CREATE INDEX idx_churn_risk ON customer_churn_predictions(risk_segment);
