DO $$
DECLARE
    r RECORD;
    val_count INTEGER;
BEGIN
    FOR r IN 
        SELECT table_schema, table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND data_type IN ('text', 'character varying', 'jsonb')
    LOOP
        BEGIN
            EXECUTE format('SELECT count(*) FROM %I.%I WHERE %I::text LIKE %L', 
                r.table_schema, r.table_name, r.column_name, '%1184567639%') 
                INTO val_count;
            IF val_count > 0 THEN
                RAISE NOTICE 'Found in %.%: % rows', r.table_name, r.column_name, val_count;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Skip columns that might fail to cast or query
                NULL;
        END;
    END LOOP;
END;
$$;
