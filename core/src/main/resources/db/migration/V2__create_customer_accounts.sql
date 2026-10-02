CREATE TABLE customer_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_number VARCHAR(12) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ux_customer_accounts_user UNIQUE (user_id),
    CONSTRAINT ux_customer_accounts_number UNIQUE (account_number),
    CONSTRAINT fk_customer_accounts_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_customer_accounts_number_format
        CHECK (account_number ~ '^[0-9]{12}$')
);
