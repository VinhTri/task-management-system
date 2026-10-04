ALTER TABLE wallet_transactions
    DROP CONSTRAINT ck_wallet_transactions_type;

ALTER TABLE wallet_transactions
    ADD CONSTRAINT ck_wallet_transactions_type
        CHECK (transaction_type IN (
            'DEPOSIT',
            'WITHDRAWAL',
            'TRANSFER_OUT',
            'TRANSFER_IN'
        ));

CREATE TABLE wallet_transfers (
    id BIGSERIAL PRIMARY KEY,
    reference_code VARCHAR(40) NOT NULL,
    sender_wallet_id BIGINT NOT NULL,
    recipient_wallet_id BIGINT NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    sender_balance_before NUMERIC(19, 2) NOT NULL,
    sender_balance_after NUMERIC(19, 2) NOT NULL,
    recipient_balance_before NUMERIC(19, 2) NOT NULL,
    recipient_balance_after NUMERIC(19, 2) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_wallet_transfers_sender
        FOREIGN KEY (sender_wallet_id) REFERENCES wallets (id) ON DELETE RESTRICT,
    CONSTRAINT fk_wallet_transfers_recipient
        FOREIGN KEY (recipient_wallet_id) REFERENCES wallets (id) ON DELETE RESTRICT,
    CONSTRAINT uk_wallet_transfers_reference UNIQUE (reference_code),
    CONSTRAINT uk_wallet_transfers_sender_idempotency
        UNIQUE (sender_wallet_id, idempotency_key),
    CONSTRAINT ck_wallet_transfers_different_wallets
        CHECK (sender_wallet_id <> recipient_wallet_id),
    CONSTRAINT ck_wallet_transfers_status CHECK (status IN ('SUCCESS')),
    CONSTRAINT ck_wallet_transfers_amount CHECK (amount > 0),
    CONSTRAINT ck_wallet_transfers_balances CHECK (
        sender_balance_before >= 0
        AND sender_balance_after >= 0
        AND recipient_balance_before >= 0
        AND recipient_balance_after >= 0
    )
);

CREATE INDEX ix_wallet_transfers_sender_created
    ON wallet_transfers (sender_wallet_id, created_at DESC);

CREATE INDEX ix_wallet_transfers_recipient_created
    ON wallet_transfers (recipient_wallet_id, created_at DESC);

ALTER TABLE wallet_transactions
    ADD COLUMN transfer_id BIGINT;

ALTER TABLE wallet_transactions
    ADD CONSTRAINT fk_wallet_transactions_transfer
        FOREIGN KEY (transfer_id) REFERENCES wallet_transfers (id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX ux_wallet_transactions_transfer_type
    ON wallet_transactions (transfer_id, transaction_type)
    WHERE transfer_id IS NOT NULL;
