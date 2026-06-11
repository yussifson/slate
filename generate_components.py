import os

components = [
    {
        "id": "customsdoc",
        "name": "UnivCustomsDoc",
        "title": "Customs Documentation",
        "icon": "FileText",
        "fields": [
            {"name": "document_number", "label": "Document Number", "type": "text"},
            {"name": "origin_country", "label": "Country of Origin", "type": "text"},
            {"name": "destination_country", "label": "Destination Country", "type": "text"},
            {"name": "status", "label": "Status", "type": "select", "options": ["Pending", "Processing", "Cleared", "Rejected"]}
        ]
    },
    {
        "id": "carriercontract",
        "name": "UnivCarrierContract",
        "title": "Carrier Contracts",
        "icon": "Briefcase",
        "fields": [
            {"name": "carrier_name", "label": "Carrier Name", "type": "text"},
            {"name": "valid_until", "label": "Valid Until", "type": "date"},
            {"name": "rate_per_mile", "label": "Rate Per Mile ($)", "type": "number"},
            {"name": "status", "label": "Contract Status", "type": "select", "options": ["Active", "Expired", "Under Negotiation"]}
        ]
    },
    {
        "id": "coldchain",
        "name": "UnivColdChain",
        "title": "Cold Chain Tracking",
        "icon": "ThermometerSnowflake",
        "fields": [
            {"name": "sensor_id", "label": "Sensor ID", "type": "text"},
            {"name": "temperature", "label": "Current Temp (C)", "type": "number"},
            {"name": "location", "label": "Location", "type": "text"},
            {"name": "status", "label": "Status", "type": "select", "options": ["Normal", "Warning", "Critical Excursion"]}
        ]
    },
    {
        "id": "crossdocking",
        "name": "UnivCrossDocking",
        "title": "Cross-Docking Operations",
        "icon": "ArrowRightLeft",
        "fields": [
            {"name": "inbound_truck", "label": "Inbound Truck ID", "type": "text"},
            {"name": "outbound_truck", "label": "Outbound Truck ID", "type": "text"},
            {"name": "dock_number", "label": "Dock Number", "type": "text"},
            {"name": "status", "label": "Transfer Status", "type": "select", "options": ["Scheduled", "In Progress", "Completed"]}
        ]
    },
    {
        "id": "damagedgoods",
        "name": "UnivDamagedGoods",
        "title": "Damaged Goods Log",
        "icon": "PackageX",
        "fields": [
            {"name": "item_id", "label": "Item ID", "type": "text"},
            {"name": "damage_desc", "label": "Damage Description", "type": "text"},
            {"name": "quantity", "label": "Quantity Damaged", "type": "number"},
            {"name": "claim_status", "label": "Claim Status", "type": "select", "options": ["Open", "Processing", "Resolved"]}
        ]
    },
    {
        "id": "forkliftmaintenance",
        "name": "UnivForkliftMaintenance",
        "title": "Forklift Maintenance",
        "icon": "Wrench",
        "fields": [
            {"name": "forklift_id", "label": "Forklift ID", "type": "text"},
            {"name": "last_service", "label": "Last Service Date", "type": "date"},
            {"name": "next_service", "label": "Next Service Date", "type": "date"},
            {"name": "condition", "label": "Condition", "type": "select", "options": ["Good", "Needs Repair", "Out of Service"]}
        ]
    },
    {
        "id": "billoflading",
        "name": "UnivBillOfLading",
        "title": "Bill of Lading",
        "icon": "FileStack",
        "fields": [
            {"name": "bol_number", "label": "BOL Number", "type": "text"},
            {"name": "shipper", "label": "Shipper", "type": "text"},
            {"name": "consignee", "label": "Consignee", "type": "text"},
            {"name": "freight_charge", "label": "Freight Charge ($)", "type": "number"}
        ]
    },
    {
        "id": "permittracker",
        "name": "UnivPermitTracker",
        "title": "Permit Tracker",
        "icon": "Stamp",
        "fields": [
            {"name": "permit_type", "label": "Permit Type", "type": "text"},
            {"name": "issued_date", "label": "Issued Date", "type": "date"},
            {"name": "expiry_date", "label": "Expiry Date", "type": "date"},
            {"name": "authority", "label": "Issuing Authority", "type": "text"}
        ]
    },
    {
        "id": "blueprint",
        "name": "UnivBlueprint",
        "title": "Blueprint Management",
        "icon": "Map",
        "fields": [
            {"name": "project_name", "label": "Project Name", "type": "text"},
            {"name": "version", "label": "Version", "type": "text"},
            {"name": "architect", "label": "Architect", "type": "text"},
            {"name": "status", "label": "Status", "type": "select", "options": ["Draft", "Under Review", "Approved"]}
        ]
    },
    {
        "id": "equipmentrental",
        "name": "UnivEquipmentRental",
        "title": "Equipment Rental",
        "icon": "Truck",
        "fields": [
            {"name": "equipment_name", "label": "Equipment Name", "type": "text"},
            {"name": "vendor", "label": "Vendor", "type": "text"},
            {"name": "start_date", "label": "Start Date", "type": "date"},
            {"name": "end_date", "label": "End Date", "type": "date"}
        ]
    },
    {
        "id": "snaglist",
        "name": "UnivSnagList",
        "title": "Snag List",
        "icon": "ClipboardList",
        "fields": [
            {"name": "issue_desc", "label": "Issue Description", "type": "text"},
            {"name": "location", "label": "Location", "type": "text"},
            {"name": "priority", "label": "Priority", "type": "select", "options": ["Low", "Medium", "High", "Critical"]},
            {"name": "status", "label": "Status", "type": "select", "options": ["Open", "In Progress", "Fixed"]}
        ]
    },
    {
        "id": "concretetest",
        "name": "UnivConcreteTest",
        "title": "Concrete Testing",
        "icon": "Hammer",
        "fields": [
            {"name": "batch_id", "label": "Batch ID", "type": "text"},
            {"name": "slump_result", "label": "Slump Test (mm)", "type": "number"},
            {"name": "strength", "label": "Compressive Strength (MPa)", "type": "number"},
            {"name": "test_date", "label": "Test Date", "type": "date"}
        ]
    },
    {
        "id": "workorder",
        "name": "UnivWorkOrder",
        "title": "Work Orders",
        "icon": "Wrench",
        "fields": [
            {"name": "order_id", "label": "Order ID", "type": "text"},
            {"name": "task_desc", "label": "Task Description", "type": "text"},
            {"name": "assigned_to", "label": "Assigned To", "type": "text"},
            {"name": "completion_pct", "label": "Completion (%)", "type": "number"}
        ]
    },
    {
        "id": "assemblyline",
        "name": "UnivAssemblyLine",
        "title": "Assembly Line Monitor",
        "icon": "Factory",
        "fields": [
            {"name": "line_name", "label": "Line Name", "type": "text"},
            {"name": "current_product", "label": "Current Product", "type": "text"},
            {"name": "output_rate", "label": "Output Rate (/hr)", "type": "number"},
            {"name": "status", "label": "Line Status", "type": "select", "options": ["Running", "Paused", "Maintenance"]}
        ]
    },
    {
        "id": "rawmaterial",
        "name": "UnivRawMaterial",
        "title": "Raw Materials",
        "icon": "Box",
        "fields": [
            {"name": "material_name", "label": "Material Name", "type": "text"},
            {"name": "supplier", "label": "Supplier", "type": "text"},
            {"name": "stock_level", "label": "Stock Level", "type": "number"},
            {"name": "reorder_point", "label": "Reorder Point", "type": "number"}
        ]
    },
    {
        "id": "scraprate",
        "name": "UnivScrapRate",
        "title": "Scrap Rate Analysis",
        "icon": "Trash2",
        "fields": [
            {"name": "batch_number", "label": "Batch Number", "type": "text"},
            {"name": "defect_count", "label": "Defect Count", "type": "number"},
            {"name": "total_produced", "label": "Total Produced", "type": "number"},
            {"name": "scrap_pct", "label": "Scrap %", "type": "number"}
        ]
    }
]

template = '''import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import { __ICON__, Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';

const __NAME__ = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({__DEFAULT_FORM_DATA__});

  const tableName = 'univ___ID__s';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: records, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setData(records || []);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      const { error } = await supabase.from(tableName).update(formData).eq('id', editId);
      if (error) console.error('Error updating:', error);
    } else {
      const { error } = await supabase.from(tableName).insert([formData]);
      if (error) console.error('Error inserting:', error);
    }
    setFormData({__DEFAULT_FORM_DATA__});
    setIsEditing(false);
    setEditId(null);
    fetchData();
  };

  const handleEdit = (record) => {
    setFormData({__EDIT_FORM_DATA__});
    setEditId(record.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) console.error('Error deleting:', error);
    else fetchData();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-slate-50 min-h-screen font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <__ICON__ size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">__TITLE__</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track __LOWER_TITLE__ records</p>
          </div>
        </div>
        <button
          onClick={() => { setIsEditing(true); setEditId(null); setFormData({__DEFAULT_FORM_DATA__}); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Record</span>
        </button>
      </motion.div>

      {isEditing && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {editId ? 'Edit Record' : 'Create New Record'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            __FORM_INPUTS__
            <div className="col-span-full flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditId(null); setFormData({__DEFAULT_FORM_DATA__}); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <X size={18} /> Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save size={18} /> Save Record
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-700">Recent Records</h3>
          <button onClick={fetchData} className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
            <RefreshCw size={32} className="animate-spin mb-3 text-blue-500" />
            <p>Loading data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <__ICON__ size={48} className="mb-4 text-slate-300 stroke-[1.5]" />
            <p className="text-lg">No records found</p>
            <p className="text-sm mt-1">Click 'New Record' to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                  __TABLE_HEADERS__
                  <th className="p-4 font-medium rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((record) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={record.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    __TABLE_CELLS__
                    <td className="p-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default __NAME__;
'''

for comp in components:
    default_form_data = ", ".join([f"{f['name']}: ''" for f in comp['fields']])
    edit_form_data = ", ".join([f"{f['name']}: record.{f['name']} || ''" for f in comp['fields']])
    
    form_inputs = ""
    for f in comp['fields']:
        if f['type'] == 'select':
            options = "".join([f'<option value="{opt}">{opt}</option>' for opt in f['options']])
            form_inputs += f"""
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">{f['label']}</label>
              <select
                name="{f['name']}"
                value={{formData.{f['name']}}}
                onChange={{handleInputChange}}
                className="p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Select {f['label']}...</option>
                {options}
              </select>
            </div>"""
        else:
            form_inputs += f"""
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">{f['label']}</label>
              <input
                type="{f['type']}"
                name="{f['name']}"
                value={{formData.{f['name']}}}
                onChange={{handleInputChange}}
                className="p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter {f['label'].lower()}"
                required
              />
            </div>"""
            
    table_headers = "".join([f'<th className="p-4 font-medium">{f["label"]}</th>' for f in comp['fields']])
    
    table_cells = ""
    for f in comp['fields']:
        if f['type'] == 'select':
            table_cells += f"""
                    <td className="p-4 text-slate-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {{record.{f['name']}}}
                      </span>
                    </td>"""
        else:
            table_cells += f"""
                    <td className="p-4 text-slate-700">{{record.{f['name']}}}</td>"""
            
    file_content = template.replace("__ID__", comp['id']) \
                           .replace("__NAME__", comp['name']) \
                           .replace("__TITLE__", comp['title']) \
                           .replace("__ICON__", comp['icon']) \
                           .replace("__LOWER_TITLE__", comp['title'].lower()) \
                           .replace("__DEFAULT_FORM_DATA__", default_form_data) \
                           .replace("__EDIT_FORM_DATA__", edit_form_data) \
                           .replace("__FORM_INPUTS__", form_inputs) \
                           .replace("__TABLE_HEADERS__", table_headers) \
                           .replace("__TABLE_CELLS__", table_cells)
    
    filepath = os.path.join(r"c:\Users\USER\OneDrive\Documents\airflake\src\components\universal", f"{comp['name']}.jsx")
    with open(filepath, "w") as file:
        file.write(file_content)

print("Generated all files.")
