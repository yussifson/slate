import { column, Schema, Table } from '@powersync/web';

export const AppSchema = new Schema({
    companies: new Table({
        created_date: column.text,
        updated_date: column.text,
        created_by: column.text,
        name: column.text,
        industry: column.text,
        size: column.text,
        country: column.text,
        address: column.text,
        website: column.text,
        contact_email: column.text,
        contact_phone: column.text,
        logo_url: column.text,
        subscription_tier: column.text,
        is_active: column.integer,
        settings: column.text
    }),
    industry_records: new Table({
        created_date: column.text,
        updated_date: column.text,
        created_by: column.text,
        company_id: column.text,
        industry: column.text,
        record_type: column.text,
        data: column.text,
        status: column.text,
        tags: column.text,
        notes: column.text
    }),
    staff_records: new Table({
        created_date: column.text,
        updated_date: column.text,
        created_by: column.text,
        company_id: column.text,
        user_id: column.text,
        department: column.text,
        role: column.text,
        manager_id: column.text,
        status: column.text,
        hire_date: column.text,
        salary: column.integer,
        notes: column.text
    }),
    profiles: new Table({
        created_date: column.text,
        updated_date: column.text,
        created_by: column.text,
        role: column.text,
        company_id: column.text,
        company_name: column.text,
        phone: column.text,
        avatar_url: column.text,
        department: column.text,
        bar_number: column.text
    })
});
