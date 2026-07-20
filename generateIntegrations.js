import fs from 'fs';
import * as simpleIcons from 'simple-icons';

// Hardcoded SVGs for ones missing from simple-icons
const FALLBACK_SVGS = {
  'siSlack': '<path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.835zM17.688 8.835a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.313zM15.165 18.958a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.52v-2.522h2.523zM15.165 17.687a2.527 2.527 0 0 1-2.523-2.521 2.528 2.528 0 0 1 2.523-2.521h6.313A2.527 2.527 0 0 1 24 15.166a2.528 2.528 0 0 1-2.522 2.521h-6.313z" fill="#E01E5A"/>',
  'siMicrosoftteams': '<path d="M12.984 10.144H7.992V5.152h4.992v4.992zM21.96 10.144H14.12v-4.992h7.84v4.992zM12.984 21.36H7.992v-9.552h4.992v9.552zM21.96 21.36H14.12v-9.552h7.84v9.552z" fill="#6264A7"/>',
  'siMicrosoftsharepoint': '<path d="M22.03 5.48a3.17 3.17 0 0 0-3.17-3.17H5.14A3.17 3.17 0 0 0 1.97 5.48v13.04a3.17 3.17 0 0 0 3.17 3.17h13.72a3.17 3.17 0 0 0 3.17-3.17V5.48zm-11.4 12.83H7.72v-1.63h2.91v1.63zm0-3.5H7.72v-1.63h2.91v1.63zm0-3.5H7.72V9.68h2.91v1.63zm4.84 7h-2.91v-1.63h2.91v1.63zm0-3.5h-2.91v-1.63h2.91v1.63zm0-3.5h-2.91V9.68h2.91v1.63z" fill="#0078D4"/>',
  'siMicrosoftonedrive': '<path d="M23.5 12c0-2.3-1.8-4.1-4.1-4.1-.2 0-.4 0-.6.1-1.3-3.5-4.6-5.9-8.4-5.9-5.1 0-9.2 4.1-9.2 9.2 0 1.7.5 3.3 1.3 4.7-2.6 1.4-4.3 4.2-4.3 7.2 0 4.6 3.8 8.4 8.4 8.4h12.5c4 0 7.3-3.3 7.3-7.3 0-3.3-2.2-6.1-5.3-7.1-.1-.1-.1-.1-.1-.2.8-1.5 1.2-3.1 1.2-4.8z" fill="#0078D4"/>',
  'siMondaydotcom': '<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.636 17.636l-3.535-3.535a4.97 4.97 0 0 1-2.101.465 4.97 4.97 0 0 1-2.101-.465l-3.535 3.535A9.953 9.953 0 0 0 12 22c2.761 0 5.261-1.12 7.071-2.929l-1.435-1.435z" fill="#FF3D57"/>',
  'siSalesforce': '<path d="M16.14 8.79a4.84 4.84 0 00-4.66-3.41 4.78 4.78 0 00-3.69 1.77 3.51 3.51 0 00-2.36-.93 3.55 3.55 0 00-3.55 3.43c0 .09 0 .17.02.26A2.88 2.88 0 000 12.63a2.9 2.9 0 002.9 2.9h14.93a3.57 3.57 0 001.35-6.86A4.81 4.81 0 0016.14 8.79z" fill="#00A1E0"/>',
  'siZohocrm': '<path d="M2.5 19h19v2h-19zm14.1-13.6c-2.2 0-3.8 1.4-4.5 3.3-1.6-1.5-3.5-2.2-5.4-2.2-3.5 0-6.1 2.5-6.1 6.1s2.6 6.1 6.1 6.1c2 0 3.9-1.1 4.9-2.7 1.1 1.7 3 2.7 5.1 2.7 3.6 0 6.3-2.6 6.3-6.1s-2.7-7.2-6.4-7.2zm0 11.2c-2.3 0-3.9-2.1-3.9-4.8 0-2.5 1.5-4.5 3.8-4.5 2.2 0 4.1 1.7 4.1 4.4 0 2.8-1.9 4.9-4 4.9zm-9.3.4c-2.3 0-4-1.9-4-4.3 0-2.3 1.7-4.2 4-4.2 1.6 0 2.8.9 3.5 2.4l-2.6 1.5c-.3-.5-.7-.8-1.3-.8-1.1 0-1.8.9-1.8 1.9 0 1.1.8 2 1.9 2 .5 0 1-.3 1.2-.8l2.5 1.5c-.8 1.6-2 2.6-3.4 2.6z" fill="#124B8B"/>',
  'siPipedrive': '<path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm0 4.5A7.5 7.5 0 1 0 19.5 12h-3a4.5 4.5 0 1 1-4.5-4.5V4.5z" fill="#262626"/>',
  'siFreshdesk': '<path d="M20.25 10.5h-16.5a2.25 2.25 0 0 0 0 4.5h16.5a2.25 2.25 0 0 0 0-4.5zm-16.5-6a2.25 2.25 0 0 0 0 4.5h16.5a2.25 2.25 0 0 0 0-4.5h-16.5zm0 12a2.25 2.25 0 0 0 0 4.5h16.5a2.25 2.25 0 0 0 0-4.5h-16.5z" fill="#12344D"/>',
  'siAmazonwebservices': '<path d="M11.996 0C5.37 0 .002 5.37.002 11.998c0 6.627 5.368 11.998 11.994 11.998 6.629 0 12.002-5.371 12.002-11.998C24.004 5.37 18.627 0 11.996 0zm0 21.6A9.605 9.605 0 1 1 21.6 11.998 9.608 9.608 0 0 1 11.996 21.6z" fill="#232F3E"/>',
  'siMicrosoftazure': '<path d="M5.483 21.3H24L14.025 4.013l-3.3 5.4L18.42 20H7.275zm-1.89-1.2L11.58 2.7l-4.2-2.7L0 17.55z" fill="#0089D6"/>',
  'siCanva': '<path d="M12 0A12 12 0 1 0 24 12 12.013 12.013 0 0 0 12 0zm0 21.6a9.6 9.6 0 1 1 9.6-9.6 9.61 9.61 0 0 1-9.6 9.6z" fill="#00C4CC"/>',
  'siOracle': '<path d="M16.485 20.301H7.515A7.514 7.514 0 0 1 0 12.785a7.515 7.515 0 0 1 7.515-7.515h8.97a7.515 7.515 0 0 1 7.515 7.515 7.514 7.514 0 0 1-7.515 7.516zm-8.97-12.721a5.21 5.21 0 0 0-5.207 5.206 5.21 5.21 0 0 0 5.206 5.206h8.97a5.21 5.21 0 0 0 5.207-5.206 5.21 5.21 0 0 0-5.207-5.206z" fill="#F80000"/>',
  'siServicenow': '<path d="M12 0C5.372 0 0 5.373 0 12c0 6.628 5.372 12 12 12s12-5.372 12-12c0-6.627-5.372-12-12-12zm0 19.5a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" fill="#81B5A1"/>',
  'siWorkday': '<path d="M12.013 0C5.385 0 .013 5.373.013 12c0 6.628 5.372 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12zm0 18.257a6.257 6.257 0 1 1 0-12.514 6.257 6.257 0 0 1 0 12.514z" fill="#005CB9"/>',
  'siBamboohr': '<path d="M12.01 0C5.385 0 .01 5.373.01 12c0 6.628 5.375 12 12 12 6.626 0 12-5.372 12-12 0-6.627-5.374-12-12-12zm0 18.257a6.257 6.257 0 1 1 0-12.514 6.257 6.257 0 0 1 0 12.514z" fill="#7AB800"/>',
  'siDocusign': '<path d="M20.25 10.5h-16.5a2.25 2.25 0 0 0 0 4.5h16.5a2.25 2.25 0 0 0 0-4.5zM3.75 4.5h16.5a2.25 2.25 0 0 0 0-4.5H3.75a2.25 2.25 0 0 0 0 4.5zM20.25 19.5h-16.5a2.25 2.25 0 0 0 0 4.5h16.5a2.25 2.25 0 0 0 0-4.5z" fill="#286FB4"/>',
  'siJira': '<path d="M2.28 14.88L9.06 21.66l6.81-6.81-6.81-6.81L2.28 14.88zM15.87 2.34l-6.81 6.81 6.81 6.81 6.81-6.81L15.87 2.34z" fill="#0052CC"/>'
};

const TIER_1 = [
  { id: 'slack', name: 'Slack', provider: 'slack', iconName: 'siSlack', color: 'E01E5A', category: 'Messaging', desc: 'Capture channel messages, threads, and files for AI analysis.', types: ['Messages', 'Threads', 'Files'] },
  { id: 'ms_teams', name: 'Microsoft Teams', provider: 'microsoft', iconName: 'siMicrosoftteams', color: '6264A7', category: 'Meetings', desc: 'Sync Teams chats, meeting recordings, and shared files.', types: ['Chats', 'Recordings', 'Files'] },
  { id: 'google_workspace', name: 'Google Workspace', provider: 'google', iconName: 'siGoogleworkspace', color: '4285F4', category: 'Productivity', desc: 'Connect all your Google Workspace data seamlessly.', types: ['Docs', 'Sheets', 'Slides'] },
  { id: 'google_drive', name: 'Google Drive', provider: 'google', iconName: 'siGoogledrive', color: '1FA463', category: 'Storage', desc: 'Import Docs, Sheets, Slides and PDFs.', types: ['Documents', 'Spreadsheets', 'Presentations', 'PDFs'] },
  { id: 'sharepoint', name: 'Microsoft SharePoint', provider: 'microsoft', iconName: 'siMicrosoftsharepoint', color: '0078D4', category: 'Storage', desc: 'Connect SharePoint sites and enterprise documents.', types: ['Sites', 'Documents', 'Lists'] },
  { id: 'microsoft_onedrive', name: 'OneDrive', provider: 'microsoft', iconName: 'siMicrosoftonedrive', color: '0078D4', category: 'Storage', desc: 'Connect Microsoft 365 documents and OneDrive files.', types: ['Documents', 'Spreadsheets', 'Presentations'] },
  { id: 'zoom', name: 'Zoom', provider: 'zoom', iconName: 'siZoom', color: '0B5CFF', category: 'Meetings', desc: 'Auto-import meeting recordings and transcripts.', types: ['Recordings', 'Transcripts', 'Meeting Notes'] },
  { id: 'google_meet', name: 'Google Meet', provider: 'google', iconName: 'siGooglemeet', color: '00832D', category: 'Meetings', desc: 'Import Google Meet recordings and transcripts automatically.', types: ['Recordings', 'Transcripts'] },
  { id: 'notion', name: 'Notion', provider: 'notion', iconName: 'siNotion', color: '000000', category: 'Knowledge Base', desc: 'Sync pages and databases into your organizational memory.', types: ['Pages', 'Databases', 'Notes'] },
  { id: 'jira', name: 'Jira', provider: 'jira', iconName: 'siJira', color: '0052CC', category: 'Project Management', desc: 'Connect tickets, sprints, and bugs to meeting decisions.', types: ['Issues', 'Sprints', 'Epics'] }
];

const TIER_2 = [
  { id: 'github', name: 'GitHub', provider: 'github', iconName: 'siGithub', color: '181717', category: 'Engineering', desc: 'Link issues, PRs, and commits to your meeting decisions.', types: ['Issues', 'Pull Requests', 'Commits'] },
  { id: 'gitlab', name: 'GitLab', provider: 'gitlab', iconName: 'siGitlab', color: 'FC6D26', category: 'Engineering', desc: 'Sync merge requests and repository activity.', types: ['Merge Requests', 'Issues', 'Pipelines'] },
  { id: 'linear', name: 'Linear', provider: 'linear', iconName: 'siLinear', color: '5E6AD2', category: 'Engineering', desc: 'Engineering issue tracking connected to your meeting notes.', types: ['Issues', 'Projects', 'Cycles'] },
  { id: 'asana', name: 'Asana', provider: 'asana', iconName: 'siAsana', color: '273347', category: 'Project Management', desc: 'Sync projects and tasks with your organizational memory.', types: ['Projects', 'Tasks', 'Goals'] },
  { id: 'trello', name: 'Trello', provider: 'trello', iconName: 'siTrello', color: '0052CC', category: 'Project Management', desc: 'Import boards and cards into your knowledge base.', types: ['Boards', 'Cards', 'Comments'] },
  { id: 'clickup', name: 'ClickUp', provider: 'clickup', iconName: 'siClickup', color: '7B68EE', category: 'Project Management', desc: 'Tasks and project management integrated with your meeting knowledge.', types: ['Tasks', 'Docs', 'Comments'] },
  { id: 'monday', name: 'Monday.com', provider: 'monday', iconName: 'siMondaydotcom', color: 'FF3D57', category: 'Project Management', desc: 'Sync work operating system data.', types: ['Boards', 'Items', 'Updates'] },
  { id: 'dropbox', name: 'Dropbox', provider: 'dropbox', iconName: 'siDropbox', color: '0061FF', category: 'Storage', desc: 'Cloud file synchronization for documents and media.', types: ['Files', 'Folders'] },
  { id: 'box', name: 'Box', provider: 'box', iconName: 'siBox', color: '0061D5', category: 'Storage', desc: 'Enterprise document management and content collaboration.', types: ['Files', 'Folders', 'Notes'] },
  { id: 'confluence', name: 'Confluence', provider: 'confluence', iconName: 'siConfluence', color: '172B4D', category: 'Knowledge Base', desc: 'Import engineering docs and enterprise knowledge pages.', types: ['Pages', 'Spaces', 'Blogs'] }
];

const TIER_3 = [
  { id: 'salesforce', name: 'Salesforce', provider: 'salesforce', iconName: 'siSalesforce', color: '00A1E0', category: 'CRM', desc: 'Connect customer meetings and sales knowledge.', types: ['Accounts', 'Opportunities', 'Notes'] },
  { id: 'hubspot', name: 'HubSpot', provider: 'hubspot', iconName: 'siHubspot', color: 'FF7A59', category: 'CRM', desc: 'Link CRM data with meeting notes and customer interactions.', types: ['Contacts', 'Deals', 'Notes'] },
  { id: 'zoho_crm', name: 'Zoho CRM', provider: 'zoho_crm', iconName: 'siZohocrm', color: '124B8B', category: 'CRM', desc: 'Sync contacts, accounts, and deals from Zoho.', types: ['Leads', 'Deals', 'Accounts'] },
  { id: 'pipedrive', name: 'Pipedrive', provider: 'pipedrive', iconName: 'siPipedrive', color: '262626', category: 'CRM', desc: 'Import sales pipeline data.', types: ['Deals', 'Contacts', 'Activities'] },
  { id: 'zendesk', name: 'Zendesk', provider: 'zendesk', iconName: 'siZendesk', color: '03363D', category: 'Customer Support', desc: 'Connect support tickets and customer conversations.', types: ['Tickets', 'Users', 'Articles'] },
  { id: 'intercom', name: 'Intercom', provider: 'intercom', iconName: 'siIntercom', color: '286EFA', category: 'Customer Support', desc: 'Sync customer chats and support interactions.', types: ['Conversations', 'Contacts', 'Articles'] },
  { id: 'freshdesk', name: 'Freshdesk', provider: 'freshdesk', iconName: 'siFreshdesk', color: '12344D', category: 'Customer Support', desc: 'Import tickets and knowledge base articles.', types: ['Tickets', 'Contacts', 'Solutions'] },
  { id: 'mailchimp', name: 'Mailchimp', provider: 'mailchimp', iconName: 'siMailchimp', color: 'FFE01B', category: 'Marketing', desc: 'Sync email marketing campaigns and audience data.', types: ['Campaigns', 'Audiences', 'Reports'] },
  { id: 'stripe', name: 'Stripe', provider: 'stripe', iconName: 'siStripe', color: '008CDD', category: 'Finance', desc: 'Connect billing and subscription data.', types: ['Customers', 'Subscriptions', 'Invoices'] },
  { id: 'quickbooks', name: 'QuickBooks', provider: 'quickbooks', iconName: 'siQuickbooks', color: '2CA01C', category: 'Finance', desc: 'Sync accounting and financial records.', types: ['Invoices', 'Customers', 'Expenses'] }
];

const TIER_4 = [
  { id: 'aws', name: 'AWS', provider: 'aws', iconName: 'siAmazonwebservices', color: '232F3E', category: 'Cloud Infrastructure', desc: 'Connect cloud infrastructure alerts and logs.', types: ['EC2', 'S3', 'CloudWatch'] },
  { id: 'azure', name: 'Azure', provider: 'azure', iconName: 'siMicrosoftazure', color: '0089D6', category: 'Cloud Infrastructure', desc: 'Sync Azure resources and monitoring data.', types: ['Virtual Machines', 'App Services', 'Monitor'] },
  { id: 'google_cloud', name: 'Google Cloud', provider: 'google', iconName: 'siGooglecloud', color: '4285F4', category: 'Cloud Infrastructure', desc: 'Import GCP resources and logs.', types: ['Compute Engine', 'Cloud Storage', 'Logging'] },
  { id: 'datadog', name: 'Datadog', provider: 'datadog', iconName: 'siDatadog', color: '632CA6', category: 'Monitoring', desc: 'Sync monitoring dashboards and alerts.', types: ['Dashboards', 'Alerts', 'Logs'] },
  { id: 'sentry', name: 'Sentry', provider: 'sentry', iconName: 'siSentry', color: '362D59', category: 'Monitoring', desc: 'Connect error tracking and performance monitoring.', types: ['Issues', 'Releases', 'Alerts'] },
  { id: 'pagerduty', name: 'PagerDuty', provider: 'pagerduty', iconName: 'siPagerduty', color: '06AC38', category: 'Monitoring', desc: 'Sync incident response data.', types: ['Incidents', 'Services', 'On-call'] },
  { id: 'bitbucket', name: 'Bitbucket', provider: 'bitbucket', iconName: 'siBitbucket', color: '0052CC', category: 'Engineering', desc: 'Import repositories and pull requests.', types: ['Repositories', 'Pull Requests', 'Pipelines'] },
  { id: 'jenkins', name: 'Jenkins', provider: 'jenkins', iconName: 'siJenkins', color: 'D33833', category: 'Engineering', desc: 'Sync CI/CD pipeline statuses.', types: ['Jobs', 'Builds', 'Logs'] },
  { id: 'figma', name: 'Figma', provider: 'figma', iconName: 'siFigma', color: 'F24E1E', category: 'Design', desc: 'Connect design files and prototypes.', types: ['Files', 'Components', 'Comments'] },
  { id: 'canva', name: 'Canva', provider: 'canva', iconName: 'siCanva', color: '00C4CC', category: 'Design', desc: 'Import design assets and templates.', types: ['Designs', 'Folders', 'Assets'] }
];

const TIER_5 = [
  { id: 'whatsapp', name: 'WhatsApp Business API', provider: 'whatsapp', iconName: 'siWhatsapp', color: '25D366', category: 'Messaging', desc: 'Sync customer chats from WhatsApp.', types: ['Messages', 'Contacts', 'Templates'] },
  { id: 'telegram', name: 'Telegram', provider: 'telegram', iconName: 'siTelegram', color: '26A5E4', category: 'Messaging', desc: 'Connect Telegram channels and groups.', types: ['Messages', 'Channels', 'Bots'] },
  { id: 'airtable', name: 'Airtable', provider: 'airtable', iconName: 'siAirtable', color: 'F82B60', category: 'Knowledge Base', desc: 'Import bases and table records.', types: ['Bases', 'Tables', 'Views'] },
  { id: 'sap', name: 'SAP', provider: 'sap', iconName: 'siSap', color: '008FD3', category: 'ERP', desc: 'Connect enterprise resource planning data.', types: ['Customers', 'Orders', 'Invoices'] },
  { id: 'oracle', name: 'Oracle', provider: 'oracle', iconName: 'siOracle', color: 'F80000', category: 'ERP', desc: 'Sync Oracle database and ERP records.', types: ['Tables', 'Views', 'Procedures'] },
  { id: 'servicenow', name: 'ServiceNow', provider: 'servicenow', iconName: 'siServicenow', color: '81B5A1', category: 'ITSM', desc: 'Import IT service management tickets.', types: ['Incidents', 'Requests', 'Changes'] },
  { id: 'workday', name: 'Workday', provider: 'workday', iconName: 'siWorkday', color: '005CB9', category: 'HR', desc: 'Sync HR and financial management data.', types: ['Employees', 'Reports', 'Tasks'] },
  { id: 'bamboohr', name: 'BambooHR', provider: 'bamboohr', iconName: 'siBamboohr', color: '7AB800', category: 'HR', desc: 'Import employee records and time off data.', types: ['Employees', 'Time Off', 'Files'] },
  { id: 'docusign', name: 'DocuSign', provider: 'docusign', iconName: 'siDocusign', color: '286FB4', category: 'Productivity', desc: 'Connect signed documents and envelopes.', types: ['Envelopes', 'Templates', 'Documents'] },
  { id: 'calendly', name: 'Calendly', provider: 'calendly', iconName: 'siCalendly', color: '006BFF', category: 'Meetings', desc: 'Sync meeting schedules and events.', types: ['Events', 'Invitees', 'Event Types'] }
];

const allIntegrations = [...TIER_1, ...TIER_2, ...TIER_3, ...TIER_4, ...TIER_5];

let output = "import React from 'react';\\n\\nexport const INTEGRATIONS = [\\n";

for (const intg of allIntegrations) {
  let svgPathOrTag = '';
  
  if (FALLBACK_SVGS[intg.iconName]) {
    svgPathOrTag = '<svg viewBox="0 0 24 24" className="w-6 h-6">' + FALLBACK_SVGS[intg.iconName] + '</svg>';
  } else if (simpleIcons[intg.iconName]) {
    svgPathOrTag = '<svg viewBox="0 0 24 24" fill="#' + intg.color + '" className="w-6 h-6"><path d="' + simpleIcons[intg.iconName].path + '"/></svg>';
  } else if (intg.id === 'google_workspace') {
    svgPathOrTag = '<svg viewBox="0 0 24 24" fill="#4285F4" className="w-6 h-6"><path d="' + simpleIcons.siGoogle.path + '"/></svg>';
  } else {
    // fallback generic
    svgPathOrTag = '<svg viewBox="0 0 24 24" fill="#' + intg.color + '" className="w-6 h-6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
  }

  output += "  {\n" +
    "    id: '" + intg.id + "',\n" +
    "    name: '" + intg.name + "',\n" +
    "    description: '" + intg.desc.replace(/'/g, "\\'") + "',\n" +
    "    icon: " + svgPathOrTag + ",\n" +
    "    color: 'from-slate-500/10 to-slate-600/5',\n" +
    "    border: 'border-slate-500/20',\n" +
    "    category: '" + intg.category + "',\n" +
    "    provider: '" + intg.provider + "',\n" +
    "    phase: 1,\n" +
    "    importTypes: " + JSON.stringify(intg.types) + "\n" +
    "  },\n";
}

output += "];\n";
output += "export const CATEGORIES = ['All', ...new Set(INTEGRATIONS.map(i => i.category))];\n";

fs.writeFileSync('src/config/integrationsList.jsx', output);
console.log("Done generating src/config/integrationsList.jsx!");
