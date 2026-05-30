const fs = require('fs');
const path = require('path');

const projectRoot = 'C:/Users/USER/OneDrive/Documents/airflake/src/pages';

const addImports = (content, imports) => {
  let lines = content.split('\n');
  const lastImportIndex = lines.reduce((acc, line, idx) => line.startsWith('import ') ? idx : acc, 0);
  lines.splice(lastImportIndex + 1, 0, ...imports);
  return lines.join('\n');
};

const addHooks = (content, hooks) => {
  const hookRegex = /(const \{ [^}]+\} = useTranslation\(\);|const \{ t \} = useTranslation\(\);)/;
  return content.replace(hookRegex, `$1\n  ${hooks.join('\n  ')}`);
};

const patchFile = (relPath, edits) => {
  const fullPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log("File not found:", fullPath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');

  if (edits.imports && edits.imports.length > 0) {
    const missingImports = edits.imports.filter(imp => !content.includes(imp.split('} from ')[0].replace('import {', '').trim()));
    if (missingImports.length > 0) {
      content = addImports(content, missingImports);
    }
  }

  if (edits.hooks && edits.hooks.length > 0) {
    const missingHooks = edits.hooks.filter(hk => !content.includes(hk.split('=')[0].trim()));
    if (missingHooks.length > 0) {
      content = addHooks(content, missingHooks);
    }
  }

  if (edits.replacements) {
    for (const r of edits.replacements) {
      content = content.replace(r.search, r.replace);
    }
  }

  fs.writeFileSync(fullPath, content);
  console.log("Patched", relPath);
};

// 1. School - FeeManagement (Stripe)
patchFile('school/FeeManagement.jsx', {
  imports: [
    `import { usePayment } from "@/hooks/integrations/usePayment";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { CreditCard } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { processPayment } = usePayment();`
  ],
  replacements: [
    {
      search: `{selectedFee.status === 'Pending' && (`,
      replace: `<Button onClick={() => { processPayment({ companyId, provider: 'stripe', amount: selectedFee.amount, currency: 'USD', description: \`School Fee \${selectedFee.id}\` }).then(()=>toast.success("Payment link sent!")).catch(()=>{}) }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1">
                      <CreditCard className="w-4 h-4" /> Send Payment Link (Stripe)
                    </Button>
                  {selectedFee.status === 'Pending' && (`
    }
  ]
});

// 2. School - Students (Twilio)
patchFile('school/Students.jsx', {
  imports: [
    `import { useNotifications } from "@/hooks/integrations/useNotifications";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { MessageSquare } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { notifyTeam } = useNotifications();`
  ],
  replacements: [
    {
      search: `<Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`,
      replace: `<Button variant="outline" onClick={() => { notifyTeam({ companyId, provider: 'twilio', message: 'School announcement for all parents.', recipientPhone: '+1234567890' }).then(()=>toast.success("SMS Sent to Parents!")).catch(()=>{}) }} className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
             <MessageSquare className="w-4 h-4 text-blue-500" /> Message Parents
           </Button>
           <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`
    }
  ]
});

// 3. HR - Recruitment (Zoom & DocuSign)
patchFile('hr/Recruitment.jsx', {
  imports: [
    `import { useContracts } from "@/hooks/integrations/useContracts";`,
    `import { useMeeting } from "@/hooks/integrations/useMeeting";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { Video, FileSignature } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { sendContract } = useContracts();`,
    `const { generateMeetingLink } = useMeeting();`
  ],
  replacements: [
    {
      search: `{selectedCandidate.status === 'Interviewing' && (`,
      replace: `<Button onClick={() => { generateMeetingLink({ companyId, provider: 'zoom', topic: \`Interview with \${selectedCandidate.name}\`, duration: 60 }).then((res)=>{ if(res.join_url) { window.open(res.join_url, '_blank'); toast.success("Zoom Started!") } }).catch(()=>{}) }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1">
                      <Video className="w-4 h-4" /> Start Zoom Interview
                    </Button>
                  {selectedCandidate.status === 'Interviewing' && (`
    },
    {
      search: `<Button onClick={() => handleStatusChange(selectedCandidate, 'Hired')} className="gap-2 bg-green-600`,
      replace: `<Button onClick={() => { sendContract({ companyId, provider: 'docusign', documentName: 'Offer Letter', signerEmail: 'candidate@example.com', signerName: selectedCandidate.name }).then(()=>toast.success("Offer Letter Sent via DocuSign!")).catch(()=>{}) }} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white flex-1">
                      <FileSignature className="w-4 h-4" /> Send Offer (DocuSign)
                    </Button>
                    <Button onClick={() => handleStatusChange(selectedCandidate, 'Hired')} className="gap-2 bg-green-600`
    }
  ]
});

// 4. HR - Leave (Slack)
patchFile('hr/Leave.jsx', {
  imports: [
    `import { useNotifications } from "@/hooks/integrations/useNotifications";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { Bell } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { notifyTeam } = useNotifications();`
  ],
  replacements: [
    {
      search: `<Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`,
      replace: `<Button variant="outline" onClick={() => { notifyTeam({ companyId, provider: 'slack', message: 'A new leave request requires approval.', channel: '#hr-approvals' }).then(()=>toast.success("HR alerted via Slack!")).catch(()=>{}) }} className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
             <Bell className="w-4 h-4 text-purple-500" /> Alert Approvers
           </Button>
           <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`
    }
  ]
});

// 5. Hotel - Reservations (Stripe & Twilio)
patchFile('hotel/Reservations.jsx', {
  imports: [
    `import { useNotifications } from "@/hooks/integrations/useNotifications";`,
    `import { usePayment } from "@/hooks/integrations/usePayment";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { CreditCard, MessageSquare } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { processPayment } = usePayment();`,
    `const { notifyTeam } = useNotifications();`
  ],
  replacements: [
    {
      search: `{selectedReservation.status === 'Confirmed' && (`,
      replace: `<Button onClick={() => { processPayment({ companyId, provider: 'stripe', amount: 150, currency: 'USD', description: \`Deposit for Reservation \${selectedReservation.id}\` }).then(()=>toast.success("Deposit checkout sent!")).catch(()=>{}) }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1">
                      <CreditCard className="w-4 h-4" /> Charge Deposit
                    </Button>
                    <Button onClick={() => { notifyTeam({ companyId, provider: 'twilio', message: \`Your booking \${selectedReservation.id} is confirmed!\`, recipientPhone: '+123' }).then(()=>toast.success("SMS Sent!")).catch(()=>{}) }} className="gap-2 bg-green-600 hover:bg-green-700 text-white flex-1">
                      <MessageSquare className="w-4 h-4" /> SMS Confirm
                    </Button>
                  {selectedReservation.status === 'Confirmed' && (`
    }
  ]
});

// 6. Insurance - Policies (DocuSign)
patchFile('insurance/Policies.jsx', {
  imports: [
    `import { useContracts } from "@/hooks/integrations/useContracts";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { FileSignature } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { sendContract } = useContracts();`
  ],
  replacements: [
    {
      search: `<Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`,
      replace: `<Button variant="outline" onClick={() => { sendContract({ companyId, provider: 'docusign', documentName: 'Policy Agreement', signerEmail: 'client@example.com', signerName: 'Client' }).then(()=>toast.success("DocuSign Sent!")).catch(()=>{}) }} className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
             <FileSignature className="w-4 h-4 text-purple-500" /> Send eSign
           </Button>
           <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`
    }
  ]
});
