targetScope = 'resourceGroup'

@description('Short application name used in resource names.')
@minLength(3)
@maxLength(20)
param appName string = 'sentiment'

@allowed([
  'development'
  'staging'
  'production'
])
param environment string = 'production'

@description('Azure region for the deployment.')
param location string = resourceGroup().location

@description('OCI image. Public GHCR works directly; private registries require registry settings.')
param containerImage string = 'ghcr.io/conseiltek-tektons/sentiment:latest'

@description('PostgreSQL database and application owner names.')
param databaseName string = 'sentiment'
param databaseAdmin string = 'sentiment_admin'

@secure()
@minLength(20)
param databasePassword string

@secure()
@minLength(32)
param nextAuthSecret string

@description('OIDC issuer for Okta, Microsoft Entra ID, Duo, or another standards-compliant provider.')
param oidcIssuer string = 'https://identity.example.com/oauth2/default'
param oidcClientId string = 'replace-me'

@secure()
param oidcClientSecret string

@secure()
param openAiApiKey string

param openAiVectorStoreId string = ''
param appServiceSku string = 'P1v3'
param postgresSku string = 'Standard_D2ds_v5'
param protectData bool = true

var suffix = uniqueString(subscription().id, resourceGroup().id, appName, environment)
var prefix = toLower('${appName}-${environment}')
var webName = take('${prefix}-${suffix}', 60)
var postgresName = take('${prefix}-pg-${suffix}', 63)
var redisName = take('${prefix}-cache-${suffix}', 63)
var vaultName = take(replace('${appName}${environment}${suffix}', '-', ''), 24)
var storageName = take('ctk${replace('${appName}${environment}${suffix}', '-', '')}', 24)
var appSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'app-integration')
var postgresSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'postgres')
var privateEndpointSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'private-endpoints')
var keyVaultSecretsUserRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
var storageBlobContributorRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
var storageQueueContributorRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '974c5e8b-45b9-4653-ba55-5f855dd0fb88')

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: '${prefix}-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.52.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'app-integration'
        properties: {
          addressPrefix: '10.52.1.0/24'
          delegations: [
            {
              name: 'web-apps'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
      {
        name: 'postgres'
        properties: {
          addressPrefix: '10.52.2.0/24'
          delegations: [
            {
              name: 'postgres-flexible-server'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
      {
        name: 'private-endpoints'
        properties: {
          addressPrefix: '10.52.3.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

resource postgresDns 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: 'private.postgres.database.azure.com'
  location: 'global'
}

resource postgresDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  parent: postgresDns
  name: '${prefix}-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: postgresName
  location: location
  sku: {
    name: postgresSku
    tier: 'GeneralPurpose'
  }
  properties: {
    version: '16'
    administratorLogin: databaseAdmin
    administratorLoginPassword: databasePassword
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
    backup: {
      backupRetentionDays: 14
      geoRedundantBackup: 'Disabled'
    }
    createMode: 'Create'
    highAvailability: {
      mode: environment == 'production' ? 'ZoneRedundant' : 'Disabled'
    }
    network: {
      delegatedSubnetResourceId: postgresSubnetId
      privateDnsZoneArmResourceId: postgresDns.id
      publicNetworkAccess: 'Disabled'
    }
    storage: {
      storageSizeGB: 128
      autoGrow: 'Enabled'
    }
  }
  dependsOn: [
    postgresDnsLink
  ]
}

resource applicationDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: postgres
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource redis 'Microsoft.Cache/redisEnterprise@2026-05-01-preview' = {
  name: redisName
  location: location
  sku: {
    name: 'Balanced_B0'
  }
  properties: {
    highAvailability: environment == 'production' ? 'Enabled' : 'Disabled'
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
  }
}

resource redisDatabase 'Microsoft.Cache/redisEnterprise/databases@2026-05-01-preview' = {
  parent: redis
  name: 'default'
  properties: {
    clientProtocol: 'Encrypted'
    clusteringPolicy: 'OSSCluster'
    evictionPolicy: 'VolatileLRU'
    port: 10000
  }
}

resource redisPrivateDns 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: 'privatelink.redisenterprise.cache.azure.net'
  location: 'global'
}

resource redisPrivateDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  parent: redisPrivateDns
  name: '${prefix}-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource redisPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-05-01' = {
  name: '${prefix}-redis-pe'
  location: location
  properties: {
    subnet: {
      id: privateEndpointSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'redis'
        properties: {
          privateLinkServiceId: redis.id
          groupIds: [
            'redisEnterprise'
          ]
        }
      }
    ]
  }
}

resource redisPrivateDnsGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-05-01' = {
  parent: redisPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'redis-enterprise'
        properties: {
          privateDnsZoneId: redisPrivateDns.id
        }
      }
    ]
  }
  dependsOn: [
    redisPrivateDnsLink
  ]
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_ZRS'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 14
    }
  }
}

resource artifacts 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'artifacts'
  properties: {
    publicAccess: 'None'
  }
}

resource queueService 'Microsoft.Storage/storageAccounts/queueServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource workQueue 'Microsoft.Storage/storageAccounts/queueServices/queues@2023-05-01' = {
  parent: queueService
  name: 'work-items'
}

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  properties: {
    enablePurgeProtection: protectData
    enableRbacAuthorization: true
    enableSoftDelete: true
    publicNetworkAccess: 'Enabled'
    sku: {
      family: 'A'
      name: 'standard'
    }
    softDeleteRetentionInDays: 14
    tenantId: tenant().tenantId
  }
}

resource databasePasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'postgres-password'
  properties: {
    value: databasePassword
  }
}

resource nextAuthSecretResource 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'nextauth-secret'
  properties: {
    value: nextAuthSecret
  }
}

resource oidcSecretResource 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'oidc-client-secret'
  properties: {
    value: oidcClientSecret
  }
}

resource openAiSecretResource 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'openai-api-key'
  properties: {
    value: openAiApiKey
  }
}

resource redisUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'redis-url'
  properties: {
    value: 'rediss://:${uriComponent(redis.listKeys().primaryKey)}@${redis.properties.hostName}:${redisDatabase.properties.port}'
  }
}

resource appPlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: '${prefix}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: appServiceSku
  }
  properties: {
    reserved: true
    zoneRedundant: environment == 'production'
  }
}

resource web 'Microsoft.Web/sites@2024-04-01' = {
  name: webName
  location: location
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    clientAffinityEnabled: false
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    serverFarmId: appPlan.id
    virtualNetworkSubnetId: appSubnetId
    siteConfig: {
      alwaysOn: true
      ftpsState: 'Disabled'
      healthCheckPath: '/api/health'
      http20Enabled: true
      linuxFxVersion: 'DOCKER|${containerImage}'
      minTlsVersion: '1.2'
      numberOfWorkers: environment == 'production' ? 2 : 1
      appSettings: [
        { name: 'APP_NAME', value: appName }
        { name: 'NODE_ENV', value: 'production' }
        { name: 'AUTH_DEMO_MODE', value: 'false' }
        { name: 'WEBSITES_PORT', value: '3000' }
        { name: 'WEBSITE_VNET_ROUTE_ALL', value: '1' }
        { name: 'NEXTAUTH_URL', value: 'https://${webName}.azurewebsites.net' }
        { name: 'NEXTAUTH_SECRET', value: '@Microsoft.KeyVault(VaultName=${vault.name};SecretName=${nextAuthSecretResource.name})' }
        { name: 'PGHOST', value: postgres.properties.fullyQualifiedDomainName }
        { name: 'PGPORT', value: '5432' }
        { name: 'PGDATABASE', value: applicationDatabase.name }
        { name: 'PGUSER', value: databaseAdmin }
        { name: 'PGPASSWORD', value: '@Microsoft.KeyVault(VaultName=${vault.name};SecretName=${databasePasswordSecret.name})' }
        { name: 'DATABASE_SSL', value: 'true' }
        { name: 'REDIS_URL', value: '@Microsoft.KeyVault(VaultName=${vault.name};SecretName=${redisUrlSecret.name})' }
        { name: 'OIDC_ISSUER', value: oidcIssuer }
        { name: 'OIDC_CLIENT_ID', value: oidcClientId }
        { name: 'OIDC_CLIENT_SECRET', value: '@Microsoft.KeyVault(VaultName=${vault.name};SecretName=${oidcSecretResource.name})' }
        { name: 'OIDC_ROLE_CLAIM', value: 'groups' }
        { name: 'OPENAI_API_KEY', value: '@Microsoft.KeyVault(VaultName=${vault.name};SecretName=${openAiSecretResource.name})' }
        { name: 'OPENAI_VECTOR_STORE_ID', value: openAiVectorStoreId }
        { name: 'AZURE_STORAGE_ACCOUNT', value: storage.name }
        { name: 'AZURE_STORAGE_CONTAINER', value: artifacts.name }
        { name: 'AZURE_STORAGE_QUEUE', value: workQueue.name }
      ]
    }
  }
}

resource webScale 'Microsoft.Insights/autoscaleSettings@2022-10-01' = {
  name: '${prefix}-autoscale'
  location: location
  properties: {
    enabled: true
    name: '${prefix}-autoscale'
    targetResourceUri: appPlan.id
    profiles: [
      {
        name: 'cpu-and-schedule'
        capacity: {
          default: environment == 'production' ? '2' : '1'
          maximum: '10'
          minimum: '1'
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricNamespace: 'microsoft.web/serverfarms'
              metricResourceUri: appPlan.id
              operator: 'GreaterThan'
              statistic: 'Average'
              threshold: 70
              timeAggregation: 'Average'
              timeGrain: 'PT1M'
              timeWindow: 'PT5M'
            }
            scaleAction: {
              cooldown: 'PT5M'
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
            }
          }
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricNamespace: 'microsoft.web/serverfarms'
              metricResourceUri: appPlan.id
              operator: 'LessThan'
              statistic: 'Average'
              threshold: 35
              timeAggregation: 'Average'
              timeGrain: 'PT1M'
              timeWindow: 'PT10M'
            }
            scaleAction: {
              cooldown: 'PT10M'
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
            }
          }
        ]
      }
    ]
  }
}

resource vaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(vault.id, web.id, keyVaultSecretsUserRole)
  scope: vault
  properties: {
    principalId: web.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRole
  }
}

resource blobAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, web.id, storageBlobContributorRole)
  scope: storage
  properties: {
    principalId: web.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: storageBlobContributorRole
  }
}

resource queueAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, web.id, storageQueueContributorRole)
  scope: storage
  properties: {
    principalId: web.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: storageQueueContributorRole
  }
}

output applicationUrl string = 'https://${web.properties.defaultHostName}'
output applicationName string = web.name
output postgresHost string = postgres.properties.fullyQualifiedDomainName
output privateArtifactContainer string = artifacts.name
output privateWorkQueue string = workQueue.name
