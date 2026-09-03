-- Reporting (CQRS read) database for the reporting-service-node.
-- The reporting service creates its own tables (daily_sales, hourly_sales,
-- sale_events) at runtime via a self-healing idempotent schema check.
CREATE DATABASE reporting;
