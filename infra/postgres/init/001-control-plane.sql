CREATE TABLE IF NOT EXISTS tenants (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  db_name VARCHAR(64) NOT NULL UNIQUE,
  db_username VARCHAR(64) NOT NULL,
  db_password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stores (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_stores_tenant_code UNIQUE (tenant_id, code),
  CONSTRAINT fk_stores_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shifts (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  closing_balance DECIMAL(12,2) NULL,
  opened_at TIMESTAMP NOT NULL,
  closed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shifts_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_shifts_store
    FOREIGN KEY (store_id) REFERENCES stores(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_shifts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shifts_tenant_store_user_open 
  ON shifts (tenant_id, store_id, user_id, closed_at);

CREATE TABLE IF NOT EXISTS processed_events (
  event_id CHAR(36) NOT NULL,
  consumer VARCHAR(64) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_processed_events PRIMARY KEY (event_id, consumer)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  event_id CHAR(36) NOT NULL UNIQUE,
  event_type VARCHAR(128) NOT NULL,
  tenant_id BIGINT NULL,
  store_id BIGINT NULL,
  user_id BIGINT NULL,
  payload_json TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
