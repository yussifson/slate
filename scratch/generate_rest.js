const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'src', 'pages', 'highschool');

const templates = [
  { name: 'SHSParentProgress', title: 'Student Progress', desc: 'Parent view of academic performance.' },
  { name: 'SHSParentAttendance', title: 'Attendance Records', desc: 'Parent view of attendance.' },
  { name: 'SHSParentFees', title: 'Fee Statements', desc: 'Parent view of billing and payments.' },
  { name: 'SHSPayments', title: 'Payment Collection', desc: 'Record incoming fee payments.' },
  { name: 'SHSScholarships', title: 'Scholarships & Bursaries', desc: 'Manage financial aid.' },
  { name: 'SHSFinancialReports', title: 'Financial Analytics', desc: 'Revenue and collection reports.' },
  { name: 'SHSBooks', title: 'Library Catalog', desc: 'Manage school library inventory.' },
  { name: 'SHSBorrowing', title: 'Book Checkouts', desc: 'Manage library borrowing.' },
  { name: 'SHSReturns', title: 'Book Returns', desc: 'Process library returns.' },
  { name: 'SHSDigitalResources', title: 'E-Library', desc: 'Digital learning materials.' },
  { name: 'SHSBuses', title: 'School Fleet', desc: 'Manage transportation vehicles.' },
  { name: 'SHSBusRoutes', title: 'Transport Routes', desc: 'Manage pickup/dropoff paths.' },
  { name: 'SHSBusAssignments', title: 'Transport Roster', desc: 'Assign students to buses.' },
  { name: 'SHSNotices', title: 'Notice Board', desc: 'General announcements.' },
  { name: 'SHSSMS', title: 'SMS Gateway', desc: 'Text messaging logs and sender.' },
  { name: 'SHSWhatsapp', title: 'WhatsApp Integration', desc: 'Automated WhatsApp messaging.' },
  { name: 'SHSEmailComms', title: 'Email Broadcasts', desc: 'Email newsletters and alerts.' },
  { name: 'SHSAcademicAnalytics', title: 'Academic Insights', desc: 'Performance trends and charts.' },
  { name: 'SHSAttendanceAnalytics', title: 'Attendance Trends', desc: 'Absence and lateness analytics.' },
  { name: 'SHSFinancialAnalytics', title: 'Revenue Dashboard', desc: 'Detailed financial health.' }
];

const generateContent = (name, title, desc) => `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ${name}() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            ${title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            ${desc}
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardContent className="p-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 mx-auto flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-[#6F00FF]" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Module Under Construction</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            The ${title} module is currently being built out for the high school ecosystem.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
`;

templates.forEach(t => {
  const filePath = path.join(targetDir, t.name + '.jsx');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, generateContent(t.name, t.title, t.desc));
    console.log("Generated " + t.name + ".jsx");
  }
});
