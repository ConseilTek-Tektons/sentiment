# Role-based access control

`src/config/rbac.ts` defines bootstrap roles, permissions, and external-group mappings. With PostgreSQL connected, authorized owners/HR administrators can save per-feature overrides from the Access control page. Protected APIs use the effective database policy; server enforcement is authoritative.

| Role | Intended user | Key access |
|---|---|---|
| `owner` | Product/data owner | Full workflows, retention, and access policy |
| `hr_admin` | People operations administrator | Surveys, reviews, goals, actions, analytics, configuration |
| `people_partner` | HR business partner | Operate cycles and action plans; view privacy-safe insights |
| `manager` | People manager | Team reviews, goals, 1:1s, and released cohort insights |
| `analyst` | People analyst | Privacy-safe dashboards and analytics; no access policy changes |
| `employee` | Individual contributor | Own reviews, goals, 1:1s, and approved assistant questions |
| `viewer` | Executive/read-only stakeholder | Released dashboards only |

Default groups are `sentiment-owners`, `people-operations`, `people-partners`, `people-managers`, `people-analytics`, and `all-employees`.

Anonymity is independent of RBAC: a privileged role can request more dimensions, but the SQL release rule still suppresses undersized cohorts. Do not add a convenience permission that exposes raw responses.

The owner role remains immutable to avoid accidental lockout. Saves are transactional and audited. Without PostgreSQL, the matrix exports a policy-as-code JSON draft. When adding a feature, update the permission type and role definitions, enforce it in each route, scope queries to the session organization, and add allow/deny tests.
