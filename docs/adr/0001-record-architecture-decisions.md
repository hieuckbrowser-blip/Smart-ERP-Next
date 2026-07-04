# ADR 0001: Record Architecture Decisions

## Status
Accepted

## Context
Smart ERP Next is growing from a monolithic NestJS/Next.js monorepo into a multi-role product team. As more contributors join and the domain expands, implicit decisions about API versioning, package boundaries, multi-tenancy and eventing risk being lost or re-litigated.

## Decision
We will use lightweight Architecture Decision Records (ADRs) stored in `docs/adr/`. Each ADR uses the same template and covers one significant decision that affects structure, behavior or operations.

## Consequences
- New team members can read the decision history in one place.
- Reviews can reference ADR numbers instead of re-explaining trade-offs.
- Each ADR is immutable once accepted; superseded decisions get a new ADR that references the old one.
