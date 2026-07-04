# Incident Runbook

## Purpose
A structured response process for production incidents: detect, respond, mitigate, resolve and learn.

## Severity levels

| Severity | Definition | Response time | Examples |
|---|---|---|---|
| SEV-1 | Service unusable or data loss | 15 minutes | All logins fail, database down, checkout broken |
| SEV-2 | Major feature degraded | 1 hour | POS page errors, reports failing, slow API |
| SEV-3 | Minor issue or warning | 4 hours | Non-critical scheduled job failure, linter warning spike |
| SEV-4 | No user impact | Next business day | Log noise, documentation gap |

## Roles

- **Incident Commander (IC)**: owns communication and decision making.
- **On-call Engineer**: investigates and mitigates.
- **Domain Owner**: provides business/technical context.
- **Scribe**: records timeline in incident doc.

## Response steps

1. **Detect**
   - Prometheus/Grafana alert, Sentry error spike, user report, health check failure.

2. **Declare**
   - Create a Slack/Teams war room.
   - Open `docs/runbooks/incident-yyyy-mm-dd-title.md` from the template below.

3. **Mitigate**
   - Roll back if the trigger is a recent release (`rollback-playbook.md`).
   - Otherwise apply the smallest safe fix (feature flag, scale up, restart).

4. **Resolve**
   - Confirm `/health` and key business flows pass for 10 minutes.
   - Mark alert resolved.

5. **Learn**
   - Within 24 hours, publish a blameless post-mortem.
   - File backlog items and assign owners.

## Incident doc template

```markdown
# INC-YYYY-MM-DD — <short title>

## Summary
What happened, severity, duration.

## Timeline
- HH:MM — Detection source
- HH:MM — Mitigation applied
- HH:MM — Resolved

## Impact
Affected users, revenue, data.

## Root cause
5 Whys or equivalent.

## Action items
| Owner | Action | Due |

## Lessons learned
```

## Escalation
- SEV-1/2: page the on-call engineer and Engineering Manager.
- SEV-3: ticket to domain owner, CC on-call.
