# Contributing

Thank you for improving Sentiment. Use a focused branch, keep changes small, and include tests for behavior or authorization changes.

## Development workflow

1. Fork or branch from `main`.
2. Use Node.js 22+ and pnpm 11. Run `pnpm install`.
3. Copy `.env.example` to `.env`; never commit real credentials.
4. Make the change and update documentation, migrations, and architecture diagrams when the contract changes.
5. Run `pnpm check`. Validate Terraform and Bicep when infrastructure is touched.
6. Open a pull request that explains user impact, security/privacy impact, testing evidence, and rollback considerations.

## Engineering expectations

- Enforce access on the server; UI visibility alone is not authorization.
- Scope database operations to the signed-in organization.
- Use parameterized SQL and versioned forward migrations.
- Preserve the local no-key AI experience and keep RAG sources explicit.
- Do not add a static-web deployment target. The supported targets are managed application runtimes.
- Do not include personal, customer, proprietary, or secret data in fixtures or logs.

By contributing, you agree that your contribution is licensed under Apache-2.0.
