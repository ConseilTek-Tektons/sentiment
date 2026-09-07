output "application_url" {
  description = "AWS App Runner application URL."
  value       = "https://${aws_apprunner_service.app.service_url}"
}

output "postgres_writer_endpoint" {
  description = "Private Aurora PostgreSQL writer endpoint."
  value       = aws_rds_cluster.postgres.endpoint
  sensitive   = true
}

output "artifact_bucket" {
  description = "Private artifact bucket. It is not a static website origin."
  value       = aws_s3_bucket.artifacts.id
}
