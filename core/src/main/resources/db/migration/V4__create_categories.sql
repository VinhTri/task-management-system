CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(80) NOT NULL,
    type VARCHAR(20) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_categories_type
        CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT ck_categories_icon_format
        CHECK (icon ~ '^[a-zA-Z0-9-]+$'),
    CONSTRAINT ck_categories_color_format
        CHECK (color ~ '^#[0-9A-F]{6}$')
);

CREATE INDEX ix_categories_user_active_type
    ON categories (user_id, active, type);

CREATE UNIQUE INDEX ux_categories_active_name_per_user
    ON categories (user_id, LOWER(name))
    WHERE active = TRUE;
