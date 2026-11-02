ALTER TABLE wallets
    ADD CONSTRAINT ck_wallets_balance_max
        CHECK (balance <= 3000000000);
