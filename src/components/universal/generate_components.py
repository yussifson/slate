import os
import re

components = {
    "cashflow": {
        "name": "UnivCashFlow",
        "icon": "DollarSign",
        "fields": [
            {"name": "description", "label": "Description", "type": "text"},
            {"name": "amount", "label": "Amount", "type": "number"},
            {"name": "type", "label": "Type (In/Out)", "type": "text"},
            {"name": "date", "label": "Date", "type": "date"}
        ],
        "table": "univ_cashflows"
    },
    "fixedasset": {
        "name": "UnivFixedAsset",
        "icon": "Box",
        "fields": [
            {"name": "asset_name", "label": "Asset Name", "type": "text"},
            {"name": "purchase_price", "label": "Purchase Price", "type": "number"},
            {"name": "depreciation", "label": "Depreciation Rate", "type": "number"},
            {"name": "location", "label": "Location", "type": "text"}
        ],
        "table": "univ_fixedassets"
    },
    "purchaseorder": {
        "name": "UnivPurchaseOrder",
        "icon": "ShoppingCart",
        "fields": [
            {"name": "vendor", "label": "Vendor", "type": "text"},
            {"name": "item", "label": "Item Description", "type": "text"},
            {"name": "quantity", "label": "Quantity", "type": "number"},
            {"name": "total", "label": "Total Price", "type": "number"}
        ],
        "table": "univ_purchaseorders"
    },
    "budgetplan": {
        "name": "UnivBudgetPlan",
        "icon": "PieChart",
        "fields": [
            {"name": "department", "label": "Department", "type": "text"},
            {"name": "allocated_budget", "label": "Allocated Budget", "type": "number"},
            {"name": "spent", "label": "Spent", "type": "number"},
            {"name": "fiscal_year", "label": "Fiscal Year", "type": "text"}
        ],
        "table": "univ_budgetplans"
    },
    "bankreconciliation": {
        "name": "UnivBankReconciliation",
        "icon": "Building",
        "fields": [
            {"name": "account_name", "label": "Account Name", "type": "text"},
            {"name": "statement_balance", "label": "Statement Balance", "type": "number"},
            {"name": "system_balance", "label": "System Balance", "type": "number"},
            {"name": "reconciliation_date", "label": "Reconciliation Date", "type": "date"}
        ],
        "table": "univ_bankreconciliations"
    },
    "stockoption": {
        "name": "UnivStockOption",
        "icon": "TrendingUp",
        "fields": [
            {"name": "employee_name", "label": "Employee Name", "type": "text"},
            {"name": "shares", "label": "Shares Granted", "type": "number"},
            {"name": "strike_price", "label": "Strike Price", "type": "number"},
            {"name": "vesting_date", "label": "Vesting Date", "type": "date"}
        ],
        "table": "univ_stockoptions"
    },
    "enrollment": {
        "name": "UnivEnrollment",
        "icon": "UserPlus",
        "fields": [
            {"name": "student_name", "label": "Student Name", "type": "text"},
            {"name": "course_name", "label": "Course Name", "type": "text"},
            {"name": "enrollment_date", "label": "Enrollment Date", "type": "date"},
            {"name": "status", "label": "Status", "type": "text"}
        ],
        "table": "univ_enrollments"
    },
    "tuition": {
        "name": "UnivTuition",
        "icon": "CreditCard",
        "fields": [
            {"name": "student_id", "label": "Student ID", "type": "text"},
            {"name": "semester", "label": "Semester", "type": "text"},
            {"name": "amount_due", "label": "Amount Due", "type": "number"},
            {"name": "due_date", "label": "Due Date", "type": "date"}
        ],
        "table": "univ_tuitions"
    },
    "scholarship": {
        "name": "UnivScholarship",
        "icon": "Award",
        "fields": [
            {"name": "scholarship_name", "label": "Scholarship Name", "type": "text"},
            {"name": "recipient", "label": "Recipient", "type": "text"},
            {"name": "amount", "label": "Amount", "type": "number"},
            {"name": "term", "label": "Term", "type": "text"}
        ],
        "table": "univ_scholarships"
    },
    "examschedule": {
        "name": "UnivExamSchedule",
        "icon": "Calendar",
        "fields": [
            {"name": "course", "label": "Course", "type": "text"},
            {"name": "exam_date", "label": "Exam Date", "type": "date"},
            {"name": "time", "label": "Time", "type": "text"},
            {"name": "location", "label": "Location", "type": "text"}
        ],
        "table": "univ_examschedules"
    },
    "alumni": {
        "name": "UnivAlumni",
        "icon": "GraduationCap",
        "fields": [
            {"name": "name", "label": "Name", "type": "text"},
            {"name": "graduation_year", "label": "Graduation Year", "type": "number"},
            {"name": "degree", "label": "Degree", "type": "text"},
            {"name": "current_employer", "label": "Current Employer", "type": "text"}
        ],
        "table": "univ_alumnis"
    },
    "librarybook": {
        "name": "UnivLibraryBook",
        "icon": "BookOpen",
        "fields": [
            {"name": "title", "label": "Title", "type": "text"},
            {"name": "author", "label": "Author", "type": "text"},
            {"name": "isbn", "label": "ISBN", "type": "text"},
            {"name": "status", "label": "Status (Available/Checked Out)", "type": "text"}
        ],
        "table": "univ_librarybooks"
    },
    "extracurricular": {
        "name": "UnivExtracurricular",
        "icon": "Activity",
        "fields": [
            {"name": "activity_name", "label": "Activity Name", "type": "text"},
            {"name": "supervisor", "label": "Supervisor", "type": "text"},
            {"name": "schedule", "label": "Schedule", "type": "text"},
            {"name": "location", "label": "Location", "type": "text"}
        ],
        "table": "univ_extracurriculars"
    },
    "doctorschedule": {
        "name": "UnivDoctorSchedule",
        "icon": "Clock",
        "fields": [
            {"name": "doctor_name", "label": "Doctor Name", "type": "text"},
            {"name": "department", "label": "Department", "type": "text"},
            {"name": "shift_start", "label": "Shift Start", "type": "text"},
            {"name": "shift_end", "label": "Shift End", "type": "text"}
        ],
        "table": "univ_doctorschedules"
    },
    "medicalbilling": {
        "name": "UnivMedicalBilling",
        "icon": "FileText",
        "fields": [
            {"name": "patient_name", "label": "Patient Name", "type": "text"},
            {"name": "service_provided", "label": "Service Provided", "type": "text"},
            {"name": "total_cost", "label": "Total Cost", "type": "number"},
            {"name": "insurance_covered", "label": "Insurance Covered", "type": "number"}
        ],
        "table": "univ_medicalbillings"
    },
    "referral": {
        "name": "UnivReferral",
        "icon": "Share2",
        "fields": [
            {"name": "patient_name", "label": "Patient Name", "type": "text"},
            {"name": "referred_to", "label": "Referred To", "type": "text"},
            {"name": "reason", "label": "Reason for Referral", "type": "text"},
            {"name": "date_referred", "label": "Date Referred", "type": "date"}
        ],
        "table": "univ_referrals"
    }
}

template = """import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../api/supabaseClient';
import { __ICON__, Plus, Trash2, Edit2, X, Check, Search, RefreshCw } from 'lucide-react';

export default function __NAME__() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
__INITIAL_FORM_STATE__
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: fetchedData, error } = await supabase
      .from('__TABLE__')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching __TABLE__:', error);
    } else {
      setData(fetchedData || []);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase
        .from('__TABLE__')
        .update(formData)
        .eq('id', editingId);
      if (error) console.error('Error updating:', error);
    } else {
      const { error } = await supabase
        .from('__TABLE__')
        .insert([formData]);
      if (error) console.error('Error inserting:', error);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ __INITIAL_FORM_STATE__ });
    fetchData();
  };

  const handleEdit = (record) => {
    setFormData({
__MAP_RECORD_STATE__
    });
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      const { error } = await supabase
        .from('__TABLE__')
        .delete()
        .eq('id', id);
      if (error) console.error('Error deleting:', error);
      else fetchData();
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <__ICON__ size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">__TITLE__ Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your __LOWER_TITLE__ records efficiently</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
          <button 
            onClick={fetchData}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              setFormData({ __INITIAL_FORM_STATE__ });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus size={18} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
__TABLE_HEADERS__
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan="__COL_SPAN__" className="p-8 text-center text-slate-500">
                      <RefreshCw className="animate-spin mx-auto mb-2" />
                      Loading records...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="__COL_SPAN__" className="p-8 text-center text-slate-500">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
__TABLE_CELLS__
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Edit Record' : 'Add New Record'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
__FORM_INPUTS__
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check size={18} />
                    <span>{editingId ? 'Update' : 'Save'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""

out_dir = "c:/Users/USER/OneDrive/Documents/airflake/src/components/universal"

for comp_id, info in components.items():
    name = info["name"]
    title = name.replace("Univ", "")
    title_spaced = re.sub(r"([A-Z])", r" \1", title).strip()
    
    icon = info["icon"]
    fields = info["fields"]
    table = info["table"]
    
    initial_form_state = ",\n".join([f"    {f['name']}: ''" for f in fields])
    map_record_state = ",\n".join([f"      {f['name']}: record.{f['name']} || ''" for f in fields])
    
    table_headers = "\n".join([f'                <th className="p-4 font-medium text-slate-500 dark:text-slate-400">{f["label"]}</th>' for f in fields])
    col_span = str(len(fields) + 1)
    
    table_cells = "\n".join([f'                      <td className="p-4">{{item.{f["name"]}}}</td>' for f in fields])
    
    form_inputs = ""
    for f in fields:
        form_inputs += f"""                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{f['label']}</label>
                  <input 
                    type="{f['type']}"
                    name="{f['name']}"
                    value={{formData.{f['name']}}}
                    onChange={{handleInputChange}}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>\n"""
                
    content = template.replace("__NAME__", name)
    content = content.replace("__ICON__", icon)
    content = content.replace("__TITLE__", title_spaced)
    content = content.replace("__LOWER_TITLE__", title_spaced.lower())
    content = content.replace("__TABLE__", table)
    content = content.replace("__INITIAL_FORM_STATE__", initial_form_state)
    content = content.replace("__MAP_RECORD_STATE__", map_record_state)
    content = content.replace("__TABLE_HEADERS__", table_headers)
    content = content.replace("__COL_SPAN__", col_span)
    content = content.replace("__TABLE_CELLS__", table_cells)
    content = content.replace("__FORM_INPUTS__", form_inputs)
    
    with open(f"{out_dir}/{name}.jsx", "w", encoding="utf-8") as file:
        file.write(content)

print("Generated 16 components successfully!")
