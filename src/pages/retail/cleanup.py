import os
import re

DIR = r"C:\Users\USER\OneDrive\Documents\airflake\src\pages\retail"

files = ["Customers.jsx", "Inventory.jsx", "Sales.jsx", "Suppliers.jsx"]

for filename in files:
    filepath = os.path.join(DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Deduplicate imports
    def dedup(import_str):
        parts = content.split(import_str)
        if len(parts) > 2:
            return parts[0] + import_str + import_str.join(parts[1:]).replace(import_str, "")
        return content

    content = dedup("import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';\n")
    content = dedup("import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';\n")
    content = dedup("import { Link } from 'react-router-dom';\n")
    content = dedup("import { MoreVertical, Edit, FileText } from 'lucide-react';\n")

    # Remove viewingItem and editingItem states added by me
    content = re.sub(r"const \[viewingItem, setViewingItem\] = useState\(null\);\n\s*", "", content)
    content = re.sub(r"const \[editingItem, setEditingItem\] = useState\(null\);\n\s*", "", content)

    # Remove the viewingItem Sheet block at the end
    sheet_pattern = r"<Sheet open=\{!!viewingItem\}.*?</Sheet>"
    content = re.sub(sheet_pattern, "", content, flags=re.DOTALL)

    # In Sales, remove my Actions header and my dropdown column
    if filename == "Sales.jsx":
        content = content.replace('<th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>\n                  ', '')
        
        # Remove my column with `setViewingItem`
        col_pattern = r'<td className="px-6 py-4 text-right">\s*<DropdownMenu>\s*<DropdownMenuTrigger asChild>\s*<Button variant="ghost" size="sm" className="h-8 w-8 p-0">\s*<MoreVertical className="h-4 w-4" />\s*</Button>\s*</DropdownMenuTrigger>\s*<DropdownMenuContent align="end">\s*<DropdownMenuItem onClick=\{\(\) => setViewingItem\(sale\)\}.*?</DropdownMenuContent>\s*</DropdownMenu>\s*</td>\s*'
        content = re.sub(col_pattern, "", content, flags=re.DOTALL)
        
        # Make the Action header plural Actions
        content = content.replace('<th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>',
                                  '<th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>')

    # Remove weird `setEditingItem(null);\n        ` in Inputs
    content = content.replace('setEditingItem(null);\n        ', '')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("CLEANUP DONE")
