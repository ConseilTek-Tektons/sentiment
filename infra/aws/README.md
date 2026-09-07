# AWS deployment

This template runs Sentiment on **AWS App Runner**, not S3 static website hosting. App Runner is the closest managed container web service to Azure App Service: it terminates TLS, monitors `/api/health`, replaces unhealthy instances, and scales the application without an EC2 fleet or Kubernetes control plane to maintain.

The data plane uses Aurora PostgreSQL Serverless v2, ElastiCache Serverless for Redis, Secrets Manager, SQS with a dead-letter queue, and a private encrypted S3 artifact bucket. S3 stores private application artifacts only; it is never the web application origin.

## Prerequisites

- Terraform 1.7 or later
- AWS credentials able to create VPC, RDS, ElastiCache, App Runner, IAM, S3, SQS, and Secrets Manager resources
- A container image already pushed to private Amazon ECR
- OIDC and optional OpenAI secrets already stored in Secrets Manager

## Deploy

```bash
terraform -chdir=infra/aws init
terraform -chdir=infra/aws plan \
  -var='container_image=123456789012.dkr.ecr.us-east-1.amazonaws.com/sentiment:2026.09.0' \
  -var='oidc_issuer=https://example.okta.com/oauth2/default' \
  -var='oidc_client_id=sentiment-production' \
  -var='oidc_client_secret_arn=arn:aws:secretsmanager:us-east-1:123456789012:secret:sentiment-oidc' \
  -var='openai_api_key_secret_arn=arn:aws:secretsmanager:us-east-1:123456789012:secret:sentiment-openai'
terraform -chdir=infra/aws apply
```

Run database migrations once from an approved runner inside the VPC. Register the output App Runner URL plus `/api/auth/callback/enterprise-sso` with the identity provider.

## Production notes

- Keep `protect_data=true`; it enables Aurora deletion protection and a final snapshot.
- Pin the container by digest and deploy immutable revisions.
- The single NAT Gateway keeps the reference deployment understandable and economical. Use one per Availability Zone when egress resilience is more important than cost.
- Store Terraform state in an encrypted, versioned remote backend with state locking before team use.
- Add your DNS name and AWS WAF policy at the organization edge. App Runner remains the application compute layer.
