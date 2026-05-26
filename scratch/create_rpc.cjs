const { Client } = require('pg');

const connectionString = 'postgresql://postgres:1948%40yajkUweb3.o@db.igigwbifmfflzvnglrrl.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('Connected to DB.');

    try {
        await client.query(`
            CREATE OR REPLACE FUNCTION public.admin_create_user(
              user_email TEXT,
              user_password TEXT
            )
            RETURNS UUID AS $$
            DECLARE
              new_user_id UUID;
              enc_password TEXT;
            BEGIN
              -- Generate a random UUID for the new user
              new_user_id := gen_random_uuid();
              -- Encrypt the password using bcrypt
              enc_password := crypt(user_password, gen_salt('bf'));

              -- Insert the user into auth.users
              INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at
              )
              VALUES (
                '00000000-0000-0000-0000-000000000000',
                new_user_id,
                'authenticated',
                'authenticated',
                user_email,
                enc_password,
                now(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                '{}'::jsonb,
                now(),
                now()
              );
              
              -- Insert the user identity into auth.identities
              INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                last_sign_in_at,
                created_at,
                updated_at,
                provider_id
              )
              VALUES (
                gen_random_uuid(),
                new_user_id,
                format('{"sub":"%s","email":"%s"}', new_user_id::text, user_email)::jsonb,
                'email',
                now(),
                now(),
                now(),
                new_user_id::text
              );

              RETURN new_user_id;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);
        console.log('RPC admin_create_user created successfully.');

        await client.query(`GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT) TO authenticated;`);
        console.log('Granted execute permission to authenticated users.');

        await client.query(`NOTIFY pgrst, 'reload schema'`);
        console.log('Schema cache reloaded.');

    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        await client.end();
    }
}

run();
