# Release Playbook

## Purpose
This runbook defines how to cut, validate and deploy a release of Smart ERP Next. It applies to the Release Manager, on-call engineer and any reviewer asked to approve a production deployment.

## Prerequisites
- [ ] `main` branch is green (test-and-build, CodeQL, Trivy, CodeRabbit all pass).
- [ ] `GAPS.md` and `docs/team/team-role-gap-assessment.md` reflect the current state.
- [ ] Version follows `docs/semver-policy.md`.
- [ ] Release notes draft is available in GitHub Releases or `.kimchi/release-notes.md`.

## Release steps

1. **Create release branch**
   ```bash
   git checkout -b release/vX.Y.Z main
   ```

2. **Bump version**
   - Update root `package.json` version.
   - Update `apps/api/package.json`, `apps/web/package.json` and `packages/*/package.json` if their public interfaces changed.

3. **Run local release quality gate**
   ```bash
   pnpm qa:release
   ```

4. **Open PR from `release/vX.Y.Z` to `main`**
   - Assign Release Manager and one domain owner.
   - Attach release notes and risk matrix.

5. **Merge only after all checks pass**
   - Do not bypass branch protection.

6. **Tag the release**
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```

7. **Trigger production deployment**
   - `release.yml` runs automatically on tags.
   - Verify Docker image build, SBOM artifact and smoke tests.

8. **Post-deploy validation**
   - Run `scripts/release-runtime-smoke.js` against production.
   - Check `/health` and `/status/metrics` for 5 minutes.

## Rollback trigger
If any smoke test fails or error rate exceeds baseline for 5 minutes, follow `rollback-playbook.md` immediately.
