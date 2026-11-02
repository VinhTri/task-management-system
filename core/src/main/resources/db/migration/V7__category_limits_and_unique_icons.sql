DROP INDEX IF EXISTS ux_categories_active_name_per_user;

-- Preserve the first legacy icon in each type and move older duplicates to a safe fallback key.
WITH duplicate_icons AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, type, LOWER(icon) ORDER BY id) AS position
    FROM categories
    WHERE active = TRUE
)
UPDATE categories
SET icon = 'legacy-' || categories.id
FROM duplicate_icons
WHERE categories.id = duplicate_icons.id
  AND duplicate_icons.position > 1;

CREATE UNIQUE INDEX ux_categories_active_name_per_user_type
    ON categories (user_id, type, LOWER(name))
    WHERE active = TRUE;

CREATE UNIQUE INDEX ux_categories_active_icon_per_user_type
    ON categories (user_id, type, LOWER(icon))
    WHERE active = TRUE;
