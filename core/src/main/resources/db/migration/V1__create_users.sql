CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       email VARCHAR(320) NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       role VARCHAR(20) NOT NULL,
                       status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                       created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                       CONSTRAINT ux_users_email UNIQUE (email),
                       CONSTRAINT ck_users_role CHECK (role IN ('USER', 'ADMIN')),
                       CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'DISABLED'))
);