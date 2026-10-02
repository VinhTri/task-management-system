CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    balance NUMERIC(19, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_wallets_account
        FOREIGN KEY (account_id) REFERENCES customer_accounts (id) ON DELETE CASCADE,
    CONSTRAINT ck_wallets_balance_non_negative CHECK (balance >= 0),
    CONSTRAINT ck_wallets_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_wallets_default_locked CHECK (NOT is_default OR locked)
);

CREATE INDEX ix_wallets_account ON wallets (account_id);

CREATE UNIQUE INDEX ux_wallets_default_per_account
    ON wallets (account_id)
    WHERE is_default = TRUE;
