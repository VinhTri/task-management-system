CREATE TABLE wallet_transactions (
                                     id BIGSERIAL PRIMARY KEY,

                                     wallet_id BIGINT NOT NULL,

                                     reference_code VARCHAR(40) NOT NULL,

                                     idempotency_key VARCHAR(100) NOT NULL,

                                     transaction_type VARCHAR(20) NOT NULL,

                                     status VARCHAR(20) NOT NULL,

                                     amount NUMERIC(19, 2) NOT NULL,

                                     balance_before NUMERIC(19, 2) NOT NULL,

                                     balance_after NUMERIC(19, 2) NOT NULL,

                                     description VARCHAR(255),

                                     created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                     updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                     CONSTRAINT fk_wallet_transactions_wallet
                                         FOREIGN KEY (wallet_id)
                                             REFERENCES wallets (id)
                                             ON DELETE RESTRICT,

                                     CONSTRAINT uk_wallet_transactions_reference
                                         UNIQUE (reference_code),

                                     CONSTRAINT uk_wallet_transactions_idempotency
                                         UNIQUE (wallet_id, idempotency_key),

                                     CONSTRAINT ck_wallet_transactions_amount_positive
                                         CHECK (amount > 0),

                                     CONSTRAINT ck_wallet_transactions_balance_before
                                         CHECK (balance_before >= 0),

                                     CONSTRAINT ck_wallet_transactions_balance_after
                                         CHECK (balance_after >= 0),

                                     CONSTRAINT ck_wallet_transactions_type
                                         CHECK (
                                             transaction_type IN (
                                                                  'DEPOSIT',
                                                                  'WITHDRAWAL'
                                                 )
                                             ),

                                     CONSTRAINT ck_wallet_transactions_status
                                         CHECK (
                                             status IN (
                                                 'SUCCESS'
                                                 )
                                             )
);

CREATE INDEX ix_wallet_transactions_wallet_created
    ON wallet_transactions (wallet_id, created_at DESC);

CREATE INDEX ix_wallet_transactions_type
    ON wallet_transactions (transaction_type);