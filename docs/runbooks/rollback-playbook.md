# Rollback Playbook

## Purpose
Restore a known-good state as quickly as possible when a release causes failures, elevated errors or data corruption.

## Decision tree

```text
Are users unable to log in or check out?
├── Yes → Immediate rollback (Section A)
└── No
    Are 5xx errors > 1% for 5 minutes OR /health failing?
    ├── Yes → Immediate rollback (Section A)
    └── No
        Is there data inconsistency but the app is functional?
        ├── Yes → Section B (data fix) + schedule rollback window
        └── No → Monitor; no rollback required
```

## Section A — Immediate rollback

1. **Identify the previous stable image tag**
   ```bash
   git tag --sort=-creatordate | head -5
   ```

2. **Redeploy previous tag**
   ```bash
   gh workflow run deploy-staging.yml -f tag=vX.Y.Z-1
   ```
   For production, rerun the previous release workflow with the stable tag.

3. **Verify rollback**
   - `/health` returns 200.
   - `/status/metrics` error rate returns to baseline.
   - Smoke tests pass (`pnpm smoke:release-runtime`).

4. **Communicate**
   - Post in incident channel: rolled back to `vX.Y.Z-1`, investigating.
   - Open/Update incident doc per `incident-runbook.md`.

## Section B — Data fix without full rollback

1. Stop the affected batch/scheduler job.
2. Capture a database snapshot before any fix.
3. Run the smallest targeted migration or script to correct the data.
4. Validate with a read-only query before releasing the fix.

## Section C — After rollback

1. Lock the failed tag in container registry to prevent accidental redeploy.
2. Capture logs, metrics and the failing commit range.
3. Create a fix-forward branch from the rolled-back tag.
4. Re-run the full release playbook before redeploying.
