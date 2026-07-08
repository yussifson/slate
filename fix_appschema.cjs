const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'src', 'api', 'AppSchema.js');
let content = fs.readFileSync(schemaPath, 'utf8');

// We will do some regex replacements for the specific tables to make sure all columns are there.
const replacements = {
  optavel_okrs: `optavel_okrs: new Table({
        id: column.text,
        company_id: column.text,
        objective: column.text,
        key_result: column.text,
        owner: column.text,
        due_date: column.text,
        progress: column.real,
        status: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_decisions: `optavel_decisions: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        description: column.text,
        status: column.text,
        decided_by: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_cap_table: `optavel_cap_table: new Table({
        id: column.text,
        company_id: column.text,
        user_id: column.text,
        shareholder_name: column.text,
        equity_percentage: column.real,
        shares: column.integer,
        share_class: column.text,
        vesting_schedule: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_campaigns: `optavel_campaigns: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        channel: column.text,
        status: column.text,
        budget: column.real,
        spent: column.real,
        goal: column.text,
        start_date: column.text,
        end_date: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_seo_tracking: `optavel_seo_tracking: new Table({
        id: column.text,
        company_id: column.text,
        keyword: column.text,
        rank: column.integer,
        previous_rank: column.integer,
        search_volume: column.integer,
        url: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_bugs: `optavel_bugs: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        description: column.text,
        severity: column.text,
        status: column.text,
        product: column.text,
        reporter_id: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_sprints: `optavel_sprints: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        goal: column.text,
        status: column.text,
        start_date: column.text,
        end_date: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_tasks: `optavel_tasks: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        description: column.text,
        status: column.text,
        priority: column.text,
        assignee_id: column.text,
        sprint_id: column.text,
        created_at: column.text
    })`,
  optavel_transactions: `optavel_transactions: new Table({
        id: column.text,
        company_id: column.text,
        type: column.text,
        amount: column.real,
        category: column.text,
        date: column.text,
        description: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_deal_rooms: `optavel_deal_rooms: new Table({
        id: column.text,
        company_id: column.text,
        lead_name: column.text,
        value: column.real,
        stage: column.text,
        probability: column.integer,
        contact_email: column.text,
        contact_phone: column.text,
        notes: column.text,
        created_at: column.text,
        updated_at: column.text
    })`
};

for (const [tableName, newDef] of Object.entries(replacements)) {
  const regex = new RegExp(tableName + ':\\s*new\\s+Table\\(\\{[\\s\\S]*?\\}\\)', 'g');
  if (content.match(regex)) {
    content = content.replace(regex, newDef);
    console.log('Replaced', tableName);
  } else {
    console.log('Failed to find', tableName);
  }
}

const newTables = [
  "optavel_deal_activities: new Table({\n        id: column.text, company_id: column.text, deal_id: column.text, activity_type: column.text, notes: column.text, created_by: column.text, created_at: column.text\n    })",
  "optavel_employees: new Table({\n        id: column.text, company_id: column.text, name: column.text, role: column.text, department: column.text, email: column.text, phone: column.text, onboarding_progress: column.integer, status: column.text, start_date: column.text, created_at: column.text, updated_at: column.text\n    })",
  "optavel_support_tickets: new Table({\n        id: column.text, company_id: column.text, title: column.text, description: column.text, severity: column.text, status: column.text, customer_name: column.text, reporter_id: column.text, assignee_id: column.text, resolution_time_hrs: column.integer, created_at: column.text, updated_at: column.text\n    })",
  "optavel_nps_responses: new Table({\n        id: column.text, company_id: column.text, score: column.integer, feedback: column.text, customer_name: column.text, user_id: column.text, created_at: column.text\n    })",
  "optavel_partners: new Table({\n        id: column.text, company_id: column.text, name: column.text, type: column.text, status: column.text, revenue_share: column.real, contact_name: column.text, contact_email: column.text, created_at: column.text, updated_at: column.text\n    })"
];

let added = false;
for (const tb of newTables) {
  const tName = tb.split(':')[0].trim();
  if (!content.includes(tName)) {
    const lastIndex = content.lastIndexOf('});');
    if (lastIndex !== -1) {
      content = content.substring(0, lastIndex) + ',\\n    ' + tb + '\\n' + content.substring(lastIndex);
      console.log('Appended', tName);
      added = true;
    }
  }
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('AppSchema updated successfully!');
