# Enterprise authentication

Sentiment uses a standard OAuth 2.0/OIDC confidential web client. The callback path is:

```text
https://<application-host>/api/auth/callback/enterprise-sso
```

Set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `OIDC_ROLE_CLAIM`. The application requests `openid profile email groups`, validates issuer/state/PKCE through NextAuth, creates a short signed session, and maps the configured claim to an application role.

## Provider patterns

| Provider | Recommended connection |
|---|---|
| Okta | Direct OIDC web application; add a groups claim to the authorization server |
| Microsoft Entra ID | Direct OIDC app registration; emit assigned application roles or groups |
| Duo Single Sign-On | SAML connection through Keycloak, Auth0, Entra External ID, or another OIDC-capable broker |
| Any SAML 2.0 IdP | Broker SAML upstream and expose OIDC downstream to Sentiment |

## Local Keycloak

Docker Compose imports `deploy/keycloak/realm.json`. Sign in to the Keycloak admin console with `admin` / `local-admin-change-me`, then inspect the `sentiment` realm and `sentiment-web` client. Local application users are intended for demonstration only; change all defaults before a shared environment.

To add an upstream SAML provider in Keycloak:

1. Open **Identity providers**, select **SAML v2.0**, and import the provider metadata.
2. Configure signature validation, encrypted assertions where supported, and the provider callback URL.
3. Add attribute/group mappers so `groups` contains the role groups in [RBAC](RBAC.md).
4. Disable Keycloak local password login if the deployment must force upstream enterprise identity.

## Production checklist

- Use HTTPS-only callback and logout URLs; never wildcard redirect URIs.
- Require MFA, phishing-resistant factors where possible, and IdP conditional-access policies.
- Keep the client secret in AWS Secrets Manager or Azure Key Vault—not in Terraform variables, container images, or GitHub secrets exposed to pull requests.
- Map only explicit groups. Unknown, missing, or malformed groups fall back to the least-privileged viewer role.
- Rotate `NEXTAUTH_SECRET` and the OIDC client secret using a controlled session-expiration window.
- Leave `AUTH_DEMO_MODE=false`.
