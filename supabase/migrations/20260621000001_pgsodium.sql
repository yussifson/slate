-- Create a named key for sensitive fields
SELECT * FROM pgsodium.create_key(name := 'slate_sensitive_fields')
WHERE NOT EXISTS (
    SELECT 1 FROM pgsodium.key WHERE name = 'slate_sensitive_fields'
);

-- Encrypt staff salary
SECURITY LABEL FOR pgsodium ON COLUMN public.staff_records.salary IS 'ENCRYPT WITH KEY NAME slate_sensitive_fields';
