CREATE TABLE IF NOT EXISTS sync_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  last_sync_at timestamp NOT NULL DEFAULT now(),
  vector_clock jsonb NOT NULL DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_sync_metadata_tenant_client ON sync_metadata(tenant_id, client_id);
