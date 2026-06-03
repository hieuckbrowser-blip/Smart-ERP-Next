export type AuditActor = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

export type AuditContext = {
  ip?: string;
  userAgent?: string;
  tenantId?: string;
  requestId?: string;
};

export type AuditEvent = {
  id: string;
  occurredAt: string;
  actor: AuditActor;
  action: string;
  resource: string;
  resourceId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  context?: AuditContext;
};
