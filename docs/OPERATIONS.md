# Operations

## Health and readiness

`GET /api/health` reports application, PostgreSQL, Redis, enterprise SSO, AI, and RAG readiness. App Runner and App Service use it for health replacement. Do not expose exception stacks or secret values through the endpoint.

## Managed-service maintenance model

The reference deployments deliberately use AWS App Runner and Azure App Service Web App for Containers. Both keep the team out of host operating-system patching, instance replacement, and container-orchestrator maintenance. Aurora Serverless v2/PostgreSQL Flexible Server and managed Redis services similarly offload backup, engine patching, failover primitives, and capacity operations.

Managed does not mean unattended: assign owners for provider maintenance windows, spend alerts, database tuning, dependency updates, security response, backup validation, and capacity limits.

## Release sequence

1. Pass `pnpm check`, IaC validation, and the container build.
2. Build once; scan and sign the OCI image; identify it by digest.
3. Back up the database and apply forward-compatible migrations.
4. Deploy a staging/App Service slot or a new App Runner revision.
5. Verify health, sign-in, a read path, an anonymity-protected cohort query, RBAC denials, and an assistant answer.
6. Shift production traffic, monitor errors/latency/database connections, then remove old revisions after the rollback window.

## Recovery objectives

Define RPO/RTO with the operator. The reference enables 14-day database backups and protects production data from direct deletion. Test point-in-time database recovery, secret recovery, queue replay, and deployment rollback at least quarterly.

## Scale signals

Watch request latency, error rate, App Runner/App Service instance count, PostgreSQL connections/CPU/locks/storage, Redis throttling, queue age, AI latency/rate limits, and IdP callback failures. Scale stateless app replicas before raising database ceilings blindly.
