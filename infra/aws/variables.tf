variable "application_name" {
  description = "Application identifier used in resource names."
  type        = string
  default     = "sentiment"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "us-east-1"
}

variable "container_image" {
  description = "Private ECR image URI including tag or digest."
  type        = string
  default     = "000000000000.dkr.ecr.us-east-1.amazonaws.com/sentiment:latest"
}

variable "database_name" {
  description = "Initial PostgreSQL database."
  type        = string
  default     = "sentiment"
}

variable "database_username" {
  description = "PostgreSQL application owner."
  type        = string
  default     = "sentiment_app"
}

variable "aurora_min_acu" {
  description = "Minimum Aurora Serverless v2 capacity."
  type        = number
  default     = 0.5
}

variable "aurora_max_acu" {
  description = "Maximum Aurora Serverless v2 capacity."
  type        = number
  default     = 8
}

variable "oidc_issuer" {
  description = "OIDC issuer URL for Okta, Entra ID, Duo, or an identity broker."
  type        = string
  default     = "https://identity.example.com/oauth2/default"
}

variable "oidc_client_id" {
  description = "OIDC confidential client identifier."
  type        = string
  default     = "replace-me"
}

variable "oidc_client_secret_arn" {
  description = "Secrets Manager ARN containing the raw OIDC client secret."
  type        = string
  default     = ""
}

variable "openai_api_key_secret_arn" {
  description = "Optional Secrets Manager ARN containing the raw OpenAI API key."
  type        = string
  default     = ""
}

variable "openai_vector_store_id" {
  description = "Optional OpenAI vector store used by file_search."
  type        = string
  default     = ""
}

variable "protect_data" {
  description = "Enable deletion protection and retain the final database snapshot."
  type        = bool
  default     = true
}
