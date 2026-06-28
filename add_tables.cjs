const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'src', 'api', 'AppSchema.js');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

const newTables = `
    // Optavel OS Internal Tables
    optavel_deal_rooms: new Table({
        id: column.text,
        company_id: column.text,
        lead_name: column.text,
        value: column.real,
        stage: column.text,
        probability: column.integer,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_okrs: new Table({
        id: column.text,
        company_id: column.text,
        objective: column.text,
        key_result: column.text,
        progress: column.real,
        status: column.text,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_decisions: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        status: column.text,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_commissions: new Table({
        id: column.text,
        company_id: column.text,
        partner_id: column.text,
        amount: column.real,
        status: column.text,
        month: column.text,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_cap_table: new Table({
        id: column.text,
        company_id: column.text,
        user_id: column.text,
        equity_percentage: column.real,
        shares: column.integer,
        vesting_schedule: column.text,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_campaigns: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        status: column.text,
        budget: column.real,
        spent: column.real,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_marketing_reports: new Table({
        id: column.text,
        company_id: column.text,
        campaign_id: column.text,
        file_url: column.text,
        file_name: column.text,
        uploaded_by: column.text,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_seo_tracking: new Table({
        id: column.text,
        company_id: column.text,
        keyword: column.text,
        rank: column.integer,
        search_volume: column.integer,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_summit_registrations: new Table({
        id: column.text,
        company_id: column.text,
        name: column.text,
        company: column.text,
        ticket_type: column.text,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_bugs: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        severity: column.text,
        status: column.text,
        product: column.text,
        reporter_id: column.text,
        created_at: column.text,
        updated_at: column.text
    }),
    optavel_sprints: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        status: column.text,
        start_date: column.text,
        end_date: column.text,
        created_at: column.text,
        updated_at: column.text
    }),
`;

// Insert the new tables before the last "});"
if (!schemaContent.includes('optavel_deal_rooms')) {
    schemaContent = schemaContent.replace(/}\);\s*$/, newTables + '});\n');
    fs.writeFileSync(schemaPath, schemaContent, 'utf8');
    console.log("Successfully added Optavel OS tables to AppSchema.js");
} else {
    console.log("Optavel OS tables already exist in AppSchema.js");
}
