# Azure deployment

This template runs Sentiment on **Azure App Service Web App for Containers**. It does not use Azure Static Web Apps. App Service provides a managed web runtime, health recovery, TLS, deployment slots, VNet integration, and autoscaling without maintaining virtual-machine operating systems.

The data plane uses PostgreSQL Flexible Server 16 on a delegated private subnet, Azure Managed Redis through a private endpoint, Key Vault references, and a private Blob container/Queue. Blob Storage stores private application artifacts only; it is not a website origin.

## Deploy

1. Build and publish the image to GHCR or Azure Container Registry.
2. Register the required providers and create a resource group.
3. Validate and deploy the Bicep template:

   ```bash
   az bicep build --file infra/azure/main.bicep
   az group create --name rg-sentiment-production --location eastus2
   export POSTGRES_PASSWORD="$(openssl rand -base64 32)"
   export NEXTAUTH_SECRET="$(openssl rand -base64 48)"
   export OIDC_CLIENT_SECRET='<provider-secret>'
   export OPENAI_API_KEY='<api-key>'
   az deployment group create \
     --resource-group rg-sentiment-production \
     --template-file infra/azure/main.bicep \
     --parameters infra/azure/production.bicepparam
   unset POSTGRES_PASSWORD NEXTAUTH_SECRET OIDC_CLIENT_SECRET OPENAI_API_KEY
   ```

   In CI, inject these four environment variables from the platform secret store rather than writing them to a file or command history.

4. Run `pnpm db:migrate` and `pnpm db:seed` once with network access to the database.
5. Register the emitted App Service URL as the OIDC redirect URI: `/api/auth/callback/enterprise-sso`.

Use a deployment slot and swap for production releases. Pin container images to an immutable digest after the first deployment.
