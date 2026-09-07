# Security model

The reference implementation applies defense in depth: enterprise identity, signed sessions, feature permissions, tenant scoping, schema validation, parameterized SQL, database constraints, secret managers, private data services, encryption, and audit events.

## Trust boundaries

- The browser is untrusted. Every protected API rechecks session and permission.
- IdP group claims are untrusted until token validation and explicit mapping.
- AI prompts and retrieved documents are untrusted data. They cannot call mutation tools.
- PostgreSQL accepts traffic only from the application network/security identity in the cloud templates.
- Redis contains ephemeral limits only and is not a durable authorization source.

## Before production

- Replace all local/demo credentials and disable demo authentication.
- Add organization-approved WAF, custom-domain, certificate, SIEM, and alert policies.
- Apply migrations through a least-privileged release identity; do not grant schema-owner rights to every runtime replica.
- Configure PostgreSQL point-in-time restore and perform a restore drill.
- Add dependency, container, IaC, and secret scanning to the release gate.
- Run threat modeling and penetration testing against the final provider configuration.

Report suspected vulnerabilities through the private process in the repository root [security policy](../SECURITY.md).
