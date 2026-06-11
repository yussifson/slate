const fs = require('fs');
const path = require('path');

const components = [
  { id: 'donorprofile', name: 'DonorProfile', title: 'Donor Profile', icon: 'User', fields: [ {name: 'name', type: 'text'}, {name: 'email', type: 'email'}, {name: 'phone', type: 'text'}, {name: 'total_donated', type: 'number'}, {name: 'donor_status', type: 'text'} ] },
  { id: 'donationlog', name: 'DonationLog', title: 'Donation Log', icon: 'Activity', fields: [ {name: 'donor_name', type: 'text'}, {name: 'amount', type: 'number'}, {name: 'date', type: 'date'}, {name: 'campaign', type: 'text'}, {name: 'payment_method', type: 'text'} ] },
  { id: 'volunteerroster', name: 'VolunteerRoster', title: 'Volunteer Roster', icon: 'User', fields: [ {name: 'volunteer_name', type: 'text'}, {name: 'email', type: 'email'}, {name: 'role', type: 'text'}, {name: 'availability', type: 'text'}, {name: 'hours_logged', type: 'number'} ] },
  { id: 'campaignmetric', name: 'CampaignMetric', title: 'Campaign Metric', icon: 'TrendingUp', fields: [ {name: 'campaign_name', type: 'text'}, {name: 'target_amount', type: 'number'}, {name: 'raised_amount', type: 'number'}, {name: 'start_date', type: 'date'}, {name: 'end_date', type: 'date'} ] },
  { id: 'beneficiarylist', name: 'BeneficiaryList', title: 'Beneficiary List', icon: 'User', fields: [ {name: 'beneficiary_name', type: 'text'}, {name: 'contact_info', type: 'text'}, {name: 'needs', type: 'text'}, {name: 'status', type: 'text'}, {name: 'assigned_to', type: 'text'} ] },
  { id: 'pledge', name: 'Pledge', title: 'Pledge', icon: 'FileText', fields: [ {name: 'donor_name', type: 'text'}, {name: 'amount', type: 'number'}, {name: 'expected_date', type: 'date'}, {name: 'status', type: 'text'}, {name: 'campaign', type: 'text'} ] },
  { id: 'sponsorship', name: 'Sponsorship', title: 'Sponsorship', icon: 'Activity', fields: [ {name: 'sponsor_name', type: 'text'}, {name: 'tier', type: 'text'}, {name: 'amount', type: 'number'}, {name: 'benefits', type: 'text'}, {name: 'start_date', type: 'date'} ] },
  { id: 'advocacy', name: 'Advocacy', title: 'Advocacy', icon: 'User', fields: [ {name: 'campaign_name', type: 'text'}, {name: 'issue', type: 'text'}, {name: 'target_audience', type: 'text'}, {name: 'actions_taken', type: 'text'}, {name: 'impact', type: 'text'} ] },
  { id: 'inkinddonation', name: 'InKindDonation', title: 'In-Kind Donation', icon: 'Activity', fields: [ {name: 'donor_name', type: 'text'}, {name: 'item_description', type: 'text'}, {name: 'estimated_value', type: 'number'}, {name: 'date_received', type: 'date'}, {name: 'condition', type: 'text'} ] },
  { id: 'expenseclaim', name: 'ExpenseClaim', title: 'Expense Claim', icon: 'FileText', fields: [ {name: 'employee_name', type: 'text'}, {name: 'amount', type: 'number'}, {name: 'category', type: 'text'}, {name: 'date', type: 'date'}, {name: 'status', type: 'text'} ] },
  { id: 'timesheet', name: 'TimeSheet', title: 'Time Sheet', icon: 'Calendar', fields: [ {name: 'employee_name', type: 'text'}, {name: 'date', type: 'date'}, {name: 'hours_worked', type: 'number'}, {name: 'project', type: 'text'}, {name: 'approved', type: 'text'} ] },
  { id: 'orgchart', name: 'OrgChart', title: 'Org Chart', icon: 'User', fields: [ {name: 'employee_name', type: 'text'}, {name: 'role', type: 'text'}, {name: 'department', type: 'text'}, {name: 'reports_to', type: 'text'}, {name: 'level', type: 'text'} ] },
  { id: 'disciplinary', name: 'Disciplinary', title: 'Disciplinary', icon: 'AlertCircle', fields: [ {name: 'employee_name', type: 'text'}, {name: 'incident_date', type: 'date'}, {name: 'issue_type', type: 'text'}, {name: 'action_taken', type: 'text'}, {name: 'status', type: 'text'} ] },
  { id: 'onboardingtask', name: 'OnboardingTask', title: 'Onboarding Task', icon: 'Calendar', fields: [ {name: 'employee_name', type: 'text'}, {name: 'task_name', type: 'text'}, {name: 'due_date', type: 'date'}, {name: 'status', type: 'text'}, {name: 'assigned_to', type: 'text'} ] },
  { id: 'exitinterview', name: 'ExitInterview', title: 'Exit Interview', icon: 'FileText', fields: [ {name: 'employee_name', type: 'text'}, {name: 'departure_date', type: 'date'}, {name: 'reason', type: 'text'}, {name: 'feedback', type: 'text'}, {name: 'interviewer', type: 'text'} ] },
  { id: 'benefitelection', name: 'BenefitElection', title: 'Benefit Election', icon: 'Activity', fields: [ {name: 'employee_name', type: 'text'}, {name: 'benefit_type', type: 'text'}, {name: 'coverage_level', type: 'text'}, {name: 'start_date', type: 'date'}, {name: 'cost', type: 'number'} ] }
];

const template = (c) => `import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, X, Plus, ${c.icon} } from 'lucide-react';
import supabase from '../../supabaseClient';

export default function Univ${c.name}() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    ${c.fields.map(f => `${f.name}: ''`).join(',\n    ')}
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('univ_${c.id}').select('*').order('created_at', { ascending: false }).limit(50);
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('univ_${c.id}').insert([formData]);
    if (!error) {
      setShowForm(false);
      setFormData({ ${c.fields.map(f => `${f.name}: ''`).join(', ')} });
      fetchItems();
    } else {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <${c.icon} className="text-blue-600" /> ${c.title}
        </h1>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-md">
            <Plus size={20} /> Add New
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 relative">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">New ${c.title} Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${c.fields.map(f => `
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1 capitalize">${f.name.replace(/_/g, ' ')}</label>
              <input
                type="${f.type}"
                value={formData.${f.name}}
                onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.value })}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={\`Enter ${f.name.replace(/_/g, ' ')}\`}
              />
            </div>`).join('')}
          </div>
          <button onClick={handleSave} disabled={loading} className="mt-6 flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
            <Save size={20} /> Save Entry
          </button>
        </motion.div>
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              ${c.fields.map(f => `
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">${f.name.replace(/_/g, ' ')}</p>
                <p className="text-gray-800 font-medium">{item.${f.name} || '-'}</p>
              </div>`).join('')}
            </div>
          </motion.div>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No ${c.title.toLowerCase()} records found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
`;

if (!fs.existsSync('c:/Users/USER/OneDrive/Documents/airflake/src/components/universal')) {
  fs.mkdirSync('c:/Users/USER/OneDrive/Documents/airflake/src/components/universal', { recursive: true });
}

components.forEach(c => {
  const filePath = path.join('c:/Users/USER/OneDrive/Documents/airflake/src/components/universal', `Univ${c.name}.jsx`);
  fs.writeFileSync(filePath, template(c));
  console.log('Created', filePath);
});
