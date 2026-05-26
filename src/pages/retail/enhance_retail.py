import os
import re

DIR = r"C:\Users\USER\OneDrive\Documents\airflake\src\pages\retail"

IMPORTS = """
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MoreVertical, Edit, FileText } from 'lucide-react';
"""

# ----------------- CUSTOMERS.JSX -----------------
with open(os.path.join(DIR, "Customers.jsx"), "r", encoding="utf-8") as f:
    cust = f.read()

cust = re.sub(r"(import \{ Button \} from '@/components/ui/button';)", r"\1" + IMPORTS, cust)

# Add viewingCustomer state and editingCustomer state
cust = re.sub(r"(const \[deleteTargetId, setDeleteTargetId\] = useState\(null\);)", 
              r"\1\n  const [viewingItem, setViewingItem] = useState(null);\n  const [editingItem, setEditingItem] = useState(null);", cust)

# Modify handleCreateCustomer to handleSaveCustomer
cust = cust.replace("const handleCreateCustomer = () => {", "const handleSaveCustomer = () => {")

cust = re.sub(r"(mutateRecord\.mutate\(\{)", r"\1\n      ...(editingItem ? { id: editingItem.id } : {}),", cust)

# Update onSuccess to reset editingItem
cust = re.sub(r"(setFormData\(\{)", r"setEditingItem(null);\n        \1", cust)

# Replace table Action column header
cust = cust.replace('<th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>',
                    '<th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>')

# Replace table actions
action_dropdown_cust = """<td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingItem(cust)}><FileText className="w-4 h-4 mr-2"/> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingItem(cust); setFormData({ name: cust.name, email: cust.email, phone: cust.phone, totalSpent: String(cust.totalSpent), orders: String(cust.orders) }); setShowModal(true); }}><Edit className="w-4 h-4 mr-2"/> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(cust.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>"""
cust = re.sub(r'<td className="px-6 py-4 text-right">\s*<Button onClick=\{\(\) => setDeleteTargetId\(cust\.id\)\}.*?</Button>\s*</td>', action_dropdown_cust, cust, flags=re.DOTALL)

# Add Add Customer / Edit Customer title
cust = cust.replace('<h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600"/> Add Customer</h2>',
                    '<h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600"/> {editingItem ? "Edit Customer" : "Add Customer"}</h2>')

cust = cust.replace('<Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateCustomer}>Add Customer</Button>',
                    '<Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveCustomer}>{editingItem ? "Update Customer" : "Add Customer"}</Button>')

cust = cust.replace('onClick={() => setShowModal(true)}', 'onClick={() => { setEditingItem(null); setFormData({name:"",email:"",phone:"",totalSpent:"",orders:""}); setShowModal(true); }}')

# Add Sheet at the end
sheet_cust = """
      <Sheet open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Customer Details</SheetTitle>
            <SheetDescription>Read-only view of customer profile.</SheetDescription>
          </SheetHeader>
          {viewingItem && (
            <div className="mt-6 space-y-4 text-sm">
              <div><span className="font-bold text-muted-foreground">ID:</span> <p>{viewingItem.custId}</p></div>
              <div><span className="font-bold text-muted-foreground">Name:</span> <p>{viewingItem.name}</p></div>
              <div><span className="font-bold text-muted-foreground">Email:</span> <p>{viewingItem.email}</p></div>
              <div><span className="font-bold text-muted-foreground">Phone:</span> <p>{viewingItem.phone}</p></div>
              <div><span className="font-bold text-muted-foreground">Total Spent:</span> <p>${viewingItem.totalSpent.toFixed(2)}</p></div>
              <div><span className="font-bold text-muted-foreground">Orders:</span> <p>{viewingItem.orders}</p></div>
              <div><span className="font-bold text-muted-foreground">Segment:</span> <p>{viewingItem.segment}</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
"""
cust = cust.replace('    </div>\n  );\n}\n', sheet_cust + '  );\n}\n')

with open(os.path.join(DIR, "Customers.jsx"), "w", encoding="utf-8") as f:
    f.write(cust)

# ----------------- INVENTORY.JSX -----------------
with open(os.path.join(DIR, "Inventory.jsx"), "r", encoding="utf-8") as f:
    inv = f.read()

inv = re.sub(r"(import \{ Button \} from '@/components/ui/button';)", r"\1" + IMPORTS, inv)

inv = re.sub(r"(const \[deleteTargetId, setDeleteTargetId\] = useState\(null\);)", 
              r"\1\n  const [viewingItem, setViewingItem] = useState(null);", inv)

action_dropdown_inv = """<td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingItem(item)}><FileText className="w-4 h-4 mr-2"/> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(item)}><Edit className="w-4 h-4 mr-2"/> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(item.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>"""
inv = re.sub(r'<td className="px-5 py-4 text-right">\s*<div className="flex items-center justify-end gap-1">.*?</div>\s*</td>', action_dropdown_inv, inv, flags=re.DOTALL)

# Add Link to supplier
inv = inv.replace('<td className="px-5 py-4 text-muted-foreground">{item.supplier || \'—\'}</td>',
                  '<td className="px-5 py-4 text-muted-foreground">{item.supplier ? <Link to="/suppliers" className="text-primary hover:underline">{item.supplier}</Link> : \'—\'}</td>')

sheet_inv = """
      <Sheet open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Inventory Details</SheetTitle>
            <SheetDescription>Read-only view of inventory item.</SheetDescription>
          </SheetHeader>
          {viewingItem && (
            <div className="mt-6 space-y-4 text-sm">
              <div><span className="font-bold text-muted-foreground">SKU:</span> <p>{viewingItem.sku}</p></div>
              <div><span className="font-bold text-muted-foreground">Name:</span> <p>{viewingItem.name}</p></div>
              <div><span className="font-bold text-muted-foreground">Category:</span> <p>{viewingItem.category}</p></div>
              <div><span className="font-bold text-muted-foreground">Supplier:</span> <p>{viewingItem.supplier ? <Link to="/suppliers" className="text-primary hover:underline">{viewingItem.supplier}</Link> : '—'}</p></div>
              <div><span className="font-bold text-muted-foreground">Price:</span> <p>${viewingItem.price.toFixed(2)}</p></div>
              <div><span className="font-bold text-muted-foreground">Cost:</span> <p>${viewingItem.costPrice.toFixed(2)}</p></div>
              <div><span className="font-bold text-muted-foreground">Quantity:</span> <p>{viewingItem.quantity}</p></div>
              <div><span className="font-bold text-muted-foreground">Status:</span> <p>{viewingItem.status}</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
"""
inv = inv.replace('    </div>\n  );\n}\n', sheet_inv + '  );\n}\n')

with open(os.path.join(DIR, "Inventory.jsx"), "w", encoding="utf-8") as f:
    f.write(inv)

# ----------------- SALES.JSX -----------------
with open(os.path.join(DIR, "Sales.jsx"), "r", encoding="utf-8") as f:
    sales = f.read()

sales = re.sub(r"(import \{ Button \} from '@/components/ui/button';)", r"\1" + IMPORTS, sales)

sales = re.sub(r"(const \[search, setSearch\] = useState\(''\);)", 
              r"\1\n  const [viewingItem, setViewingItem] = useState(null);\n  const [deleteTargetId, setDeleteTargetId] = useState(null);", sales)

sales = sales.replace('<th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Total Amount</th>',
                      '<th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Total Amount</th>\n                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>')

action_dropdown_sales = """<td className="px-6 py-4 text-right font-black text-card-foreground">${sale.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingItem(sale)}><FileText className="w-4 h-4 mr-2"/> View Details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>"""
sales = re.sub(r'<td className="px-6 py-4 text-right font-black text-card-foreground">\$\{sale.total.toFixed\(2\)\}</td>', action_dropdown_sales, sales)

sheet_sales = """
      <Sheet open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Sale Details</SheetTitle>
            <SheetDescription>Read-only view of transaction.</SheetDescription>
          </SheetHeader>
          {viewingItem && (
            <div className="mt-6 space-y-4 text-sm">
              <div><span className="font-bold text-muted-foreground">Receipt No:</span> <p>{viewingItem.saleId}</p></div>
              <div><span className="font-bold text-muted-foreground">Date:</span> <p>{viewingItem.date}</p></div>
              <div><span className="font-bold text-muted-foreground">Cashier:</span> <p>{viewingItem.cashier}</p></div>
              <div><span className="font-bold text-muted-foreground">Method:</span> <p>{viewingItem.method}</p></div>
              <div><span className="font-bold text-muted-foreground">Status:</span> <p>{viewingItem.status}</p></div>
              <div><span className="font-bold text-muted-foreground">Items:</span> <p>{viewingItem.items}</p></div>
              <div><span className="font-bold text-muted-foreground">Total:</span> <p>${viewingItem.total.toFixed(2)}</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
"""
sales = sales.replace('    </div>\n  );\n}\n', sheet_sales + '  );\n}\n')

with open(os.path.join(DIR, "Sales.jsx"), "w", encoding="utf-8") as f:
    f.write(sales)

# ----------------- SUPPLIERS.JSX -----------------
with open(os.path.join(DIR, "Suppliers.jsx"), "r", encoding="utf-8") as f:
    supp = f.read()

supp = re.sub(r"(import \{ Button \} from '@/components/ui/button';)", r"\1" + IMPORTS, supp)

supp = re.sub(r"(const \[deleteTargetId, setDeleteTargetId\] = useState\(null\);)", 
              r"\1\n  const [viewingItem, setViewingItem] = useState(null);\n  const [editingItem, setEditingItem] = useState(null);", supp)

supp = supp.replace("const handleCreateSupplier = () => {", "const handleSaveSupplier = () => {")

supp = re.sub(r"(mutateRecord\.mutate\(\{)", r"\1\n      ...(editingItem ? { id: editingItem.id } : {}),", supp)

supp = re.sub(r"(setFormData\(\{)", r"setEditingItem(null);\n        \1", supp)

supp = supp.replace('<th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>',
                    '<th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>')

action_dropdown_supp = """<td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingItem(sup)}><FileText className="w-4 h-4 mr-2"/> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingItem(sup); setFormData({ name: sup.name, category: sup.category, contact: sup.contact, phone: sup.phone, email: sup.email, rating: sup.rating }); setShowModal(true); }}><Edit className="w-4 h-4 mr-2"/> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTargetId(sup.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>"""
supp = re.sub(r'<td className="px-6 py-4 text-right">\s*<Button onClick=\{\(\) => setDeleteTargetId\(sup\.id\)\}.*?</Button>\s*</td>', action_dropdown_supp, supp, flags=re.DOTALL)

supp = supp.replace('<h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600"/> Add Supplier</h2>',
                    '<h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600"/> {editingItem ? "Edit Supplier" : "Add Supplier"}</h2>')

supp = supp.replace('<Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateSupplier}>Configure Supplier</Button>',
                    '<Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveSupplier}>{editingItem ? "Update Supplier" : "Configure Supplier"}</Button>')

supp = supp.replace('onClick={() => setShowModal(true)}', 'onClick={() => { setEditingItem(null); setFormData({name:"",category:"Electronics",contact:"",phone:"",email:"",rating:5}); setShowModal(true); }}')

sheet_supp = """
      <Sheet open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Supplier Details</SheetTitle>
            <SheetDescription>Read-only view of supplier profile.</SheetDescription>
          </SheetHeader>
          {viewingItem && (
            <div className="mt-6 space-y-4 text-sm">
              <div><span className="font-bold text-muted-foreground">Name:</span> <p>{viewingItem.name}</p></div>
              <div><span className="font-bold text-muted-foreground">Category:</span> <p>{viewingItem.category}</p></div>
              <div><span className="font-bold text-muted-foreground">Contact:</span> <p>{viewingItem.contact}</p></div>
              <div><span className="font-bold text-muted-foreground">Phone:</span> <p>{viewingItem.phone}</p></div>
              <div><span className="font-bold text-muted-foreground">Email:</span> <p>{viewingItem.email}</p></div>
              <div><span className="font-bold text-muted-foreground">Rating:</span> <p>{viewingItem.rating}</p></div>
              <div><span className="font-bold text-muted-foreground">Status:</span> <p>{viewingItem.status}</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
"""
supp = supp.replace('    </div>\n  );\n}\n', sheet_supp + '  );\n}\n')

with open(os.path.join(DIR, "Suppliers.jsx"), "w", encoding="utf-8") as f:
    f.write(supp)

print("DONE")
