import os
components = [
    {
        'id': 'chattranscript',
        'name': 'UnivChatTranscript',
        'table': 'univ_chattranscripts',
        'icon': 'MessageSquare',
        'fields': [
            ('chat_id', 'text', 'Chat ID'),
            ('customer_name', 'text', 'Customer Name'),
            ('agent_name', 'text', 'Agent Name'),
            ('duration', 'text', 'Duration'),
            ('transcript', 'textarea', 'Transcript')
        ]
    },
    {
        'id': 'customerjourney',
        'name': 'UnivCustomerJourney',
        'table': 'univ_customerjourneys',
        'icon': 'Map',
        'fields': [
            ('customer_id', 'text', 'Customer ID'),
            ('journey_stage', 'text', 'Journey Stage'),
            ('touchpoint', 'text', 'Touchpoint'),
            ('satisfaction_score', 'number', 'Satisfaction Score'),
            ('notes', 'textarea', 'Notes')
        ]
    },
    {
        'id': 'calllog',
        'name': 'UnivCallLog',
        'table': 'univ_calllogs',
        'icon': 'PhoneCall',
        'fields': [
            ('caller_id', 'text', 'Caller ID'),
            ('receiver_id', 'text', 'Receiver ID'),
            ('call_duration', 'text', 'Call Duration'),
            ('call_status', 'select', 'Call Status', ['Completed', 'Missed', 'Voicemail']),
            ('notes', 'textarea', 'Notes')
        ]
    },
    {
        'id': 'incidentreport',
        'name': 'UnivIncidentReport',
        'table': 'univ_incidentreports',
        'icon': 'AlertTriangle',
        'fields': [
            ('incident_id', 'text', 'Incident ID'),
            ('reporter_name', 'text', 'Reporter Name'),
            ('severity', 'select', 'Severity', ['Low', 'Medium', 'High', 'Critical']),
            ('status', 'select', 'Status', ['Open', 'In Progress', 'Resolved']),
            ('description', 'textarea', 'Description')
        ]
    },
    {
        'id': 'servermetric',
        'name': 'UnivServerMetric',
        'table': 'univ_servermetrics',
        'icon': 'Server',
        'fields': [
            ('server_id', 'text', 'Server ID'),
            ('cpu_usage', 'number', 'CPU Usage (%)'),
            ('memory_usage', 'number', 'Memory Usage (%)'),
            ('disk_io', 'text', 'Disk I/O'),
            ('status', 'select', 'Status', ['Healthy', 'Warning', 'Critical'])
        ]
    },
    {
        'id': 'ipaddress',
        'name': 'UnivIpAddress',
        'table': 'univ_ipaddresss',
        'icon': 'Globe',
        'fields': [
            ('ip_address', 'text', 'IP Address'),
            ('allocation_status', 'select', 'Allocation Status', ['Available', 'Allocated', 'Reserved']),
            ('assigned_to', 'text', 'Assigned To'),
            ('subnet', 'text', 'Subnet'),
            ('notes', 'textarea', 'Notes')
        ]
    },
    {
        'id': 'accesscontrol',
        'name': 'UnivAccessControl',
        'table': 'univ_accesscontrols',
        'icon': 'Lock',
        'fields': [
            ('user_id', 'text', 'User ID'),
            ('resource', 'text', 'Resource'),
            ('access_level', 'select', 'Access Level', ['Read', 'Write', 'Admin']),
            ('granted_by', 'text', 'Granted By'),
            ('expiry_date', 'date', 'Expiry Date')
        ]
    },
    {
        'id': 'sslcertificate',
        'name': 'UnivSslCertificate',
        'table': 'univ_sslcertificates',
        'icon': 'ShieldCheck',
        'fields': [
            ('domain_name', 'text', 'Domain Name'),
            ('issuer', 'text', 'Issuer'),
            ('valid_from', 'date', 'Valid From'),
            ('valid_to', 'date', 'Valid To'),
            ('status', 'select', 'Status', ['Active', 'Expired', 'Revoked'])
        ]
    },
    {
        'id': 'gdprrequest',
        'name': 'UnivGdprRequest',
        'table': 'univ_gdprrequests',
        'icon': 'FileText',
        'fields': [
            ('request_id', 'text', 'Request ID'),
            ('user_email', 'text', 'User Email'),
            ('request_type', 'select', 'Request Type', ['Data Access', 'Data Deletion', 'Data Correction']),
            ('status', 'select', 'Status', ['Pending', 'Processing', 'Completed']),
            ('due_date', 'date', 'Due Date')
        ]
    },
    {
        'id': 'softwarelicense',
        'name': 'UnivSoftwareLicense',
        'table': 'univ_softwarelicenses',
        'icon': 'Key',
        'fields': [
            ('software_name', 'text', 'Software Name'),
            ('license_key', 'text', 'License Key'),
            ('assigned_user', 'text', 'Assigned User'),
            ('expiration_date', 'date', 'Expiration Date'),
            ('status', 'select', 'Status', ['Active', 'Expired', 'Available'])
        ]
    },
    {
        'id': 'vulnerability',
        'name': 'UnivVulnerability',
        'table': 'univ_vulnerabilitys',
        'icon': 'Crosshair',
        'fields': [
            ('cve_id', 'text', 'CVE ID'),
            ('system_affected', 'text', 'System Affected'),
            ('severity', 'select', 'Severity', ['Low', 'Medium', 'High', 'Critical']),
            ('status', 'select', 'Status', ['Open', 'In Progress', 'Patched']),
            ('patch_notes', 'textarea', 'Patch Notes')
        ]
    },
    {
        'id': 'databackup',
        'name': 'UnivDataBackup',
        'table': 'univ_databackups',
        'icon': 'Database',
        'fields': [
            ('backup_id', 'text', 'Backup ID'),
            ('system_name', 'text', 'System Name'),
            ('backup_size', 'text', 'Backup Size'),
            ('status', 'select', 'Status', ['Success', 'Failed', 'In Progress']),
            ('completion_time', 'text', 'Completion Time')
        ]
    }
]

template = """import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from "@/hooks/useCompanyId";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Edit2, Trash2, XCircle, {icon} } from "lucide-react";
import { toast } from "react-hot-toast";

const EMPTY_FORM = {{
{empty_form}
}};

export default function {name}() {{
  const companyId = useCompanyId();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {{
    if (companyId) fetchRecords();
  }}, [companyId]);

  const fetchRecords = async () => {{
    try {{
      const {{ data: records, error }} = await supabase
        .from("{table}")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", {{ ascending: false }});
      
      if (error) throw error;
      setData(records || []);
    }} catch (error) {{
      console.error("Error fetching data:", error);
      toast.error("Failed to load records");
    }} finally {{
      setLoading(false);
    }}
  }};

  const handleSubmit = async (e) => {{
    e.preventDefault();
    try {{
      const payload = {{ ...formData, company_id: companyId }};
      
      if (isEditing) {{
        const {{ error }} = await supabase
          .from("{table}")
          .update(payload)
          .eq("id", formData.id)
          .eq("company_id", companyId);
        
        if (error) throw error;
        toast.success("Record updated successfully");
      }} else {{
        const {{ error }} = await supabase
          .from("{table}")
          .insert([payload]);
          
        if (error) throw error;
        toast.success("Record created successfully");
      }}
      
      setShowForm(false);
      setFormData(EMPTY_FORM);
      setIsEditing(false);
      fetchRecords();
    }} catch (error) {{
      console.error("Error saving record:", error);
      toast.error("Failed to save record");
    }}
  }};

  const handleDelete = async (id) => {{
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    
    try {{
      const {{ error }} = await supabase
        .from("{table}")
        .delete()
        .eq("id", id)
        .eq("company_id", companyId);
        
      if (error) throw error;
      toast.success("Record deleted successfully");
      fetchRecords();
    }} catch (error) {{
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }}
  }};

  const handleEdit = (record) => {{
    setFormData(record);
    setIsEditing(true);
    setShowForm(true);
  }};

  const filteredData = data.filter(record => 
    Object.values(record).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <{icon} size={{24}} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{name_clean} Management</h1>
            <p className="text-sm text-gray-500">Manage your records efficiently</p>
          </div>
        </div>
        
        <button
          onClick={() => {{
            setShowForm(true);
            setIsEditing(false);
            setFormData(EMPTY_FORM);
          }}}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={{20}} />
          Add Record
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={{20}} />
            <input
              type="text"
              placeholder="Search records..."
              value={{searchTerm}}
              onChange={{(e) => setSearchTerm(e.target.value)}}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
{table_headers}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {{loading ? (
                <tr>
                  <td colSpan="{col_span}" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="{col_span}" className="px-6 py-8 text-center text-gray-500">
                    No records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredData.map((record) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={{record.id}} 
                    className="hover:bg-gray-50"
                  >
{table_cells}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={{16}} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={{16}} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {{showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-semibold text-gray-900">
                  {{isEditing ? 'Edit Record' : 'Add New Record'}}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle size={{20}} />
                </button>
              </div>

              <form onSubmit={{handleSubmit}} className="p-6">
                <div className="space-y-4">
{form_fields}
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {{isEditing ? 'Save Changes' : 'Create Record'}}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}}
      </AnimatePresence>
    </div>
  );
}}
"""

out_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src\components\universal"

for comp in components:
    empty_form_str = ",\n".join([f"  {f[0]}: '{f[3][0] if len(f)>3 else ''}'" for f in comp['fields']])
    
    headers = []
    cells = []
    form_inputs = []
    
    for f in comp['fields']:
        f_name = f[0]
        f_type = f[1]
        f_label = f[2]
        
        headers.append(f'                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{f_label}</th>')
        
        if f_type == 'select':
            cells.append(f'                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\n                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{{record.{f_name}}}</span>\n                    </td>')
        else:
            cells.append(f'                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{record.{f_name}}}</td>')
        
        if f_type == 'select':
            options = ''.join([f'\n                      <option value="{o}">{o}</option>' for o in f[3]])
            form_inputs.append(f"""                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f_label}</label>
                    <select
                      required
                      value={{formData.{f_name}}}
                      onChange={{(e) => setFormData({{ ...formData, {f_name}: e.target.value }})}}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >{options}
                    </select>
                  </div>""")
        elif f_type == 'textarea':
            form_inputs.append(f"""                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f_label}</label>
                    <textarea
                      required
                      rows={{3}}
                      value={{formData.{f_name}}}
                      onChange={{(e) => setFormData({{ ...formData, {f_name}: e.target.value }})}}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>""")
        else:
            form_inputs.append(f"""                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f_label}</label>
                    <input
                      type="{f_type}"
                      required
                      value={{formData.{f_name}}}
                      onChange={{(e) => setFormData({{ ...formData, {f_name}: e.target.value }})}}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>""")
                  
    col_span = len(comp['fields']) + 1
    
    file_content = template.format(
        name=comp['name'],
        name_clean=comp['name'].replace('Univ', ''),
        table=comp['table'],
        icon=comp['icon'],
        empty_form=empty_form_str,
        table_headers='\n'.join(headers),
        table_cells='\n'.join(cells),
        form_fields='\n'.join(form_inputs),
        col_span=col_span
    )
    
    with open(os.path.join(out_dir, f"{{comp['name']}}.jsx"), 'w', encoding='utf-8') as f:
        f.write(file_content)

print('Done')
