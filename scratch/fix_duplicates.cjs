const fs = require('fs');
const path = require('path');

const projectRoot = 'C:/Users/USER/OneDrive/Documents/airflake/src/pages';
const filesToCheck = [
  'hospital/Appointments.jsx',
  'hospital/Prescriptions.jsx',
  'hospital/Patients.jsx',
  'retail/POS.jsx',
  'retail/Sales.jsx',
  'logistics/Shipments.jsx',
  'Invoices.jsx',
  'Documents.jsx',
  'church/Tithes.jsx',
  'church/Members.jsx',
  'school/FeeManagement.jsx',
  'school/Students.jsx',
  'hr/Recruitment.jsx',
  'hr/Leave.jsx',
  'hotel/Reservations.jsx',
  'insurance/Policies.jsx'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(projectRoot, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  content = content.replace(/const \{ processPayment \} = usePayment\(\);\s+const \{ processPayment, isProcessing \} = usePayment\(\);/g, 'const { processPayment, isProcessing } = usePayment();');
  content = content.replace(/const \{ notifyTeam \} = useNotifications\(\);\s+const \{ notifyTeam, isNotifying \} = useNotifications\(\);/g, 'const { notifyTeam, isNotifying } = useNotifications();');
  content = content.replace(/const \{ sendContract \} = useContracts\(\);\s+const \{ sendContract, isSending \} = useContracts\(\);/g, 'const { sendContract, isSending } = useContracts();');
  content = content.replace(/const \{ generateMeetingLink \} = useMeeting\(\);\s+const \{ generateMeetingLink, isGenerating \} = useMeeting\(\);/g, 'const { generateMeetingLink, isGenerating } = useMeeting();');
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log("Fixed duplicates in", file);
  }
});
