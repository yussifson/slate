---
name: powersync_schema_sync
description: Skill for diagnosing and fixing PowerSync offline data sync failures, specifically "PGRST204" (Could not find column in schema cache) and "hard error PUT/POST" when data refuses to save.
---

# PowerSync & Supabase Schema Sync Resolution

When the user complains about "things not saving permanently", "sync failing", or items hanging in a "limbo" state after being created (e.g. they disappear upon refresh), it is almost always caused by a **schema mismatch** between three critical layers:
1. **The UI/API (`RealEstateAPI.js`)**: What columns the application tries to `INSERT` or `UPDATE`.
2. **The PowerSync Schema (`AppSchema.js`)**: What columns PowerSync's local SQLite database expects and attempts to sync to the remote server.
3. **The Supabase PostgreSQL Schema**: The actual columns existing in the remote database.

## Diagnosis Steps

1. **Check PowerSync Errors**: If a `POST` or `PUT` fails with `400 (Bad Request)` and the PowerSync logs say:
   `PowerSync hard error PUT on <table_name>: Could not find the '<column_name>' column of '<table_name>' in the schema cache (PGRST204)`
   **Root Cause**: The column exists in `AppSchema.js` and is being inserted by `RealEstateAPI.js`, but it **DOES NOT EXIST** in the Supabase remote database. PowerSync tries to push it via PostgREST, and Supabase rejects it.

2. **Check Supabase Constraint Errors**: If the log says:
   `null value in column "<column_name>" of relation "<table_name>" violates not-null constraint`
   **Root Cause**: The remote Supabase database requires a column that is **MISSING** from the `INSERT` statement in `RealEstateAPI.js`.

3. **Check Data Type Errors**: If the log says:
   `invalid input syntax for type integer: "1.0"`
   **Root Cause**: The UI/API is passing a string or float (e.g., from a text input or dynamic update block) directly into a Supabase column that strictly expects an INTEGER. 

## The Fix Workflow

To ensure permanent saving across all modules (Real Estate, Procurement, Construction, etc.):

1. **Add Missing Columns to Supabase**:
   If you see `PGRST204: Could not find the '<column>' column`, generate and execute a SQL script against Supabase to add the missing column:
   ```sql
   ALTER TABLE <table_name> ADD COLUMN IF NOT EXISTS <column_name> TEXT; -- Use appropriate type
   ```

2. **Align API Inserts (`RealEstateAPI.js`)**:
   If you see a `not-null constraint` error, ensure your API's `INSERT` and `UPDATE` arrays include that column. For example, if `reviewer_id` is required, append it to your query array:
   ```javascript
   await powerSync.execute(`INSERT INTO table (id, company_id, reviewer_id) VALUES (?, ?, ?)`, [id, company_id, user_id]);
   ```
   *Always ensure the number of `?` placeholders matches the number of parameters exactly.*

3. **Align PowerSync Schema (`AppSchema.js`)**:
   Verify that **EVERY SINGLE COLUMN** being inserted in `RealEstateAPI.js` is also strictly defined in the `AppSchema.js` `Table` definition for that entity. If `RealEstateAPI.js` inserts `updated_at`, then `AppSchema.js` MUST have `updated_at: column.text`. 
   Failure to define it in `AppSchema.js` means the local device won't save it, even if Supabase supports it!

4. **Cast Values Properly**:
   In dynamic update loops (e.g. `updateDocumentTemplate`), always parse strict types:
   ```javascript
   if (dbKey === 'version') val = parseInt(val, 10) || 1;
   ```

## Automated Alignment Check

When moving to a new module/industry in this project, run a cross-check script to find mismatches automatically:
- Parse all `INSERT INTO` statements in the API file.
- Parse all `Table` definitions in `AppSchema.js`.
- Compare the arrays of columns. 
- Any column present in one but missing in the other is a guaranteed sync bug!
