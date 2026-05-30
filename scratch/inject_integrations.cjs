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

// 1. Hospital - Appointments (Twilio, Slack)
patchFile('hospital/Appointments.jsx', {
  imports: [
    `import { useNotifications } from "@/hooks/integrations/useNotifications";`,
    `import { MessageSquare, Bell } from "lucide-react";`
  ],
  hooks: [
    `const { notifyTeam } = useNotifications();`
  ],
  replacements: [
    {
      search: `{selectedAppt.status === 'Scheduled' && (`,
      replace: `<Button variant="outline" onClick={(e) => { e.stopPropagation(); notifyTeam({ companyId, provider: 'twilio', message: \`Reminder: You have an appointment at \${selectedAppt.time}.\`, recipientPhone: '+1234567890' }).then(()=>toast.success("SMS Sent!")).catch(()=>{}) }} className="gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 flex-1">
                      <MessageSquare className="w-4 h-4" /> SMS Reminder
                    </Button>
                  {selectedAppt.status === 'Scheduled' && (`
    }
  ]
});

// 2. Hospital - Prescriptions (WhatsApp / Twilio)
patchFile('hospital/Prescriptions.jsx', {
  imports: [
    `import { useNotifications } from "@/hooks/integrations/useNotifications";`,
    `import { MessageCircle } from "lucide-react";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { notifyTeam } = useNotifications();`
  ],
  replacements: [
    {
      search: `<Button variant="ghost" size="sm"`,
      replace: `<Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); notifyTeam({ companyId, provider: 'whatsapp', message: 'Your prescription is ready for pickup.', recipientPhone: '+1234567890' }).then(()=>toast.success("WhatsApp Sent!")).catch(()=>{}) }} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Send WhatsApp Update">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm"`
    }
  ]
});

// 3. Hospital - Patients (DocuSign)
patchFile('hospital/Patients.jsx', {
  imports: [
    `import { useContracts } from "@/hooks/integrations/useContracts";`,
    `import { FileSignature } from "lucide-react";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { sendContract } = useContracts();`
  ],
  replacements: [
    {
      search: `<Button variant="outline" size="sm" className="gap-2 border-dashed">`,
      replace: `<Button variant="outline" size="sm" onClick={() => { sendContract({ companyId, provider: 'docusign', documentName: 'Consent Form', signerEmail: 'patient@example.com', signerName: selectedPatient.name }).then(()=>toast.success("Consent Form Sent!")).catch(()=>{}) }} className="gap-2 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                          <FileSignature className="w-4 h-4" /> Send Consent Form (DocuSign)
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 border-dashed">`
    }
  ]
});

// 4. Retail - POS (Stripe)
patchFile('retail/POS.jsx', {
  imports: [
    `import { usePayment } from "@/hooks/integrations/usePayment";`,
    `import { CreditCard } from "lucide-react";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { processPayment } = usePayment();`
  ],
  replacements: [
    {
      search: `className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"`,
      replace: `className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { processPayment({ companyId, provider: 'stripe', amount: total, currency: 'USD', description: 'POS Checkout' }).then(()=>toast.success("Payment Processed!")).catch(()=>{}) }}`
    }
  ]
});

// 5. Retail - Sales (QuickBooks)
patchFile('retail/Sales.jsx', {
  imports: [
    `import { usePayment } from "@/hooks/integrations/usePayment";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { RefreshCcw } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { processPayment } = usePayment();`
  ],
  replacements: [
    {
      search: `<Button className="gap-2 bg-blue-600`,
      replace: `<Button variant="outline" onClick={() => { processPayment({ companyId, provider: 'quickbooks', amount: 0, description: 'Sync Sales' }).then(()=>toast.success("Synced to QuickBooks!")).catch(()=>{}) }} className="gap-2 border-slate-200">
             <RefreshCcw className="w-4 h-4 text-blue-500" /> Sync to QuickBooks
           </Button>
           <Button className="gap-2 bg-blue-600`
    }
  ]
});

// 6. Logistics - Shipments (Twilio & Slack)
patchFile('logistics/Shipments.jsx', {
  imports: [
    `import { useNotifications } from "@/hooks/integrations/useNotifications";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { MessageSquare, Bell } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { notifyTeam } = useNotifications();`
  ],
  replacements: [
    {
      search: `<Button variant="outline" className="flex-1 bg-white"`,
      replace: `<Button variant="outline" onClick={() => { notifyTeam({ companyId, provider: 'twilio', message: \`Your shipment is \${selectedShipment.status}.\`, recipientPhone: '+123' }).then(()=>toast.success("SMS Sent!")).catch(()=>{}) }} className="flex-1 bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
                        <MessageSquare className="w-4 h-4 mr-2 inline" /> Update Customer
                      </Button>
                      <Button variant="outline" onClick={() => { notifyTeam({ companyId, provider: 'slack', message: \`Shipment \${selectedShipment.id} requires attention.\`, channel: '#logistics' }).then(()=>toast.success("Slack Alert Sent!")).catch(()=>{}) }} className="flex-1 bg-white border-purple-200 text-purple-700 hover:bg-purple-50">
                        <Bell className="w-4 h-4 mr-2 inline" /> Alert Dispatch (Slack)
                      </Button>
                      <Button variant="outline" className="flex-1 bg-white"`
    }
  ]
});

// 7. General - Invoices (QuickBooks)
patchFile('Invoices.jsx', {
  imports: [
    `import { usePayment } from "@/hooks/integrations/usePayment";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { RefreshCcw, CreditCard } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { processPayment } = usePayment();`
  ],
  replacements: [
    {
      search: `{selectedInvoice.status === 'Draft' && (`,
      replace: `<Button onClick={() => { processPayment({ companyId, provider: 'stripe', amount: parseFloat(selectedInvoice.total.replace(/[^0-9.-]+/g,"")), currency: 'USD', description: \`Payment for \${selectedInvoice.id}\` }).then(()=>toast.success("Payment link sent!")).catch(()=>{}) }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white flex-1">
                      <CreditCard className="w-4 h-4" /> Send Stripe Link
                    </Button>
                    <Button onClick={() => { processPayment({ companyId, provider: 'quickbooks', amount: 0, description: 'Sync Invoice' }).then(()=>toast.success("Synced to QuickBooks!")).catch(()=>{}) }} className="gap-2 bg-green-600 hover:bg-green-700 text-white flex-1">
                      <RefreshCcw className="w-4 h-4" /> Sync to QuickBooks
                    </Button>
                  {selectedInvoice.status === 'Draft' && (`
    }
  ]
});

// 8. General - Documents (DocuSign)
patchFile('Documents.jsx', {
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
      search: `<Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50"`,
      replace: `<Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); sendContract({ companyId, provider: 'docusign', documentName: doc.title, signerEmail: 'client@example.com', signerName: 'Client' }).then(()=>toast.success("Sent via DocuSign")).catch(()=>{}) }} className="text-purple-500 hover:bg-purple-50" title="Request DocuSign Signature">
                        <FileSignature className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50"`
    }
  ]
});

// 9. Church - Tithes (Paystack)
patchFile('church/Tithes.jsx', {
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
      search: `<Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`,
      replace: `<Button variant="outline" onClick={() => { processPayment({ companyId, provider: 'paystack', amount: 100, currency: 'GHS', description: 'Online Tithe' }).then(()=>toast.success("Paystack checkout initiated")).catch(()=>{}) }} className="gap-2 border-green-200 text-green-700 hover:bg-green-50">
             <CreditCard className="w-4 h-4 text-green-500" /> Give Online (Paystack)
           </Button>
           <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`
    }
  ]
});

// 10. Church - Members (WhatsApp)
patchFile('church/Members.jsx', {
  imports: [
    `import { useNotifications } from "@/hooks/integrations/useNotifications";`,
    `import { useCompanyId } from "@/hooks/useCompanyId";`,
    `import { MessageCircle } from "lucide-react";`
  ],
  hooks: [
    `const companyId = useCompanyId();`,
    `const { notifyTeam } = useNotifications();`
  ],
  replacements: [
    {
      search: `<Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`,
      replace: `<Button variant="outline" onClick={() => { notifyTeam({ companyId, provider: 'whatsapp', message: 'Join us for service tomorrow!', recipientPhone: '+1234567890' }).then(()=>toast.success("Bulk WhatsApp Sent")).catch(()=>{}) }} className="gap-2 border-green-200 text-green-700 hover:bg-green-50">
             <MessageCircle className="w-4 h-4 text-green-500" /> Message All
           </Button>
           <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600`
    }
  ]
});
