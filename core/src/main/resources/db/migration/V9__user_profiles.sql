ALTER TABLE users ADD COLUMN username VARCHAR(50);
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);

WITH normalized AS (
    SELECT id,
           LEFT(REGEXP_REPLACE(SPLIT_PART(LOWER(email), '@', 1), '[^a-z0-9._-]', '_', 'g'), 50) AS base_name,
           ROW_NUMBER() OVER (
               PARTITION BY REGEXP_REPLACE(SPLIT_PART(LOWER(email), '@', 1), '[^a-z0-9._-]', '_', 'g')
               ORDER BY id
           ) AS duplicate_number
    FROM users
)
UPDATE users AS target
SET username = CASE
    WHEN normalized.duplicate_number = 1 THEN normalized.base_name
    ELSE LEFT(normalized.base_name, 40) || '_' || target.id
END
FROM normalized
WHERE target.id = normalized.id;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX ux_users_username_lower ON users (LOWER(username));
