const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'src', 'api', 'AppSchema.js');
let content = fs.readFileSync(schemaPath, 'utf8');

const replacements = {
  optavel_tasks: `optavel_tasks: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        description: column.text,
        status: column.text,
        priority: column.text,
        assignee_id: column.text,
        sprint_id: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_employees: `optavel_employees: new Table({
        id: column.text,
        company_id: column.text,
        name: column.text,
        role: column.text,
        department: column.text,
        email: column.text,
        phone: column.text,
        onboarding_progress: column.integer,
        status: column.text,
        start_date: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_support_tickets: `optavel_support_tickets: new Table({
        id: column.text,
        company_id: column.text,
        title: column.text,
        description: column.text,
        status: column.text,
        severity: column.text,
        customer_name: column.text,
        customer_id: column.text,
        reporter_id: column.text,
        created_at: column.text,
        updated_at: column.text
    })`,
  optavel_partners: `optavel_partners: new Table({
        id: column.text,
        company_id: column.text,
        name: column.text,
        type: column.text,
        status: column.text,
        contact_name: column.text,
        contact_email: column.text,
        revenue_share: column.real,
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

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('AppSchema surgical update applied!');
