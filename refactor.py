import os
import re

DIR = r"C:\Users\USER\OneDrive\Documents\airflake\src\pages\church"

files = [
    "Members.jsx",
    "Events.jsx",
    "Ministries.jsx",
    "Prayers.jsx",
    "Sermons.jsx",
    "SmallGroups.jsx",
    "Tithes.jsx",
    "Volunteers.jsx"
]

IMPORTS = """import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
"""

def process_file(filename):
    path = os.path.join(DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add imports
    if "DropdownMenu" not in content:
        # Insert after the last import
        imports_end = content.rfind("import ")
        if imports_end != -1:
            end_of_line = content.find("\n", imports_end)
            content = content[:end_of_line+1] + IMPORTS + content[end_of_line+1:]

    # 2. Add state variables for viewRecord and editRecord
    if "const [viewRecord, setViewRecord] = useState(null);" not in content:
        content = content.replace(
            "const [deleteTargetId, setDeleteTargetId] = useState(null);",
            "const [deleteTargetId, setDeleteTargetId] = useState(null);\n  const [viewRecord, setViewRecord] = useState(null);\n  const [editRecord, setEditRecord] = useState(null);"
        )

    # 3. Add openEdit function right before handleCreateX
    if "const openEdit =" not in content:
        handle_create_match = re.search(r'const handleCreate\w+\s*=\s*\(\)\s*=>\s*\{', content)
        if handle_create_match:
            create_func = handle_create_match.group(0)
            open_edit_code = """
  const openEdit = (record) => {
    setEditRecord(record);
    setFormData(record);
    setShowModal(true);
  };
"""
            content = content.replace(create_func, open_edit_code + "\n  " + create_func)

    # 4. Modify mutateRecord.mutate to include id if editRecord exists
    # Find mutateRecord.mutate({
    # We replace:
    # recordType: '...',
    # with:
    # ...(editRecord ? { id: editRecord.id } : {}),
    # recordType: '...',
    if "...(editRecord ? { id: editRecord.id } : {})" not in content:
        content = re.sub(
            r"(mutateRecord\.mutate\(\s*\{\s*)(recordType:\s*['\"]\w+['\"])",
            r"\1...(editRecord ? { id: editRecord.id } : {}),\n      \2",
            content, count=1
        )

    # 5. Reset editRecord on success and close
    if "setEditRecord(null);" not in content:
        content = content.replace(
            "setShowModal(false);",
            "setShowModal(false);\n        setEditRecord(null);"
        )
        content = content.replace(
            "onClick={() => setShowModal(false)}",
            "onClick={() => { setShowModal(false); setEditRecord(null); }}"
        )

    # 6. Change Save button text
    if "{editRecord ? 'Update' : " not in content:
        content = re.sub(
            r"(<Button[^>]*onClick=\{handleCreate\w+\}[^>]*>)(.*?)(</Button>)",
            r"\1{editRecord ? 'Update' : '\2'}\3",
            content
        )

    # 7. Replace the Trash icon with a DropdownMenu
    # Find something like:
    # <td className="px-6 py-4 text-right">
    #   <Button onClick={() => setDeleteTargetId(m.id)} ...> <Trash2/> </Button>
    # </td>
    # Replace with DropdownMenu
    # This is tricky because the variable name `m` or `group` changes.
    # Let's find the map variable.
    map_match = re.search(r'filtered\.map\(([a-zA-Z0-9_]+)\s*=>', content)
    if map_match:
        var_name = map_match.group(1)
        
        # In case the action column doesn't match standard regex, we inject after the second-to-last </td> in the row
        # Actually it's better to find the <td className="...text-right"> ... </td> block
        td_action_pattern = re.compile(r'<td[^>]*text-right[^>]*>.*?</td>', re.DOTALL)
        
        dropdown_code = f"""<td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={{() => setViewRecord({var_name})}}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={{() => openEdit({var_name})}}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={{() => setDeleteTargetId({var_name}.id)}} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>"""
        
        # Only replace if DropdownMenu is not already there
        if "DropdownMenuContent" not in content:
            content = td_action_pattern.sub(dropdown_code, content)

    # 8. Append the Sheet at the end before final </div>
    if "<Sheet open={!!viewRecord}" not in content:
        sheet_code = """
      <Sheet open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Details</SheetTitle>
            <SheetDescription>Read-only view of the selected record.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status').map(([key, value]) => (
              <div key={key} className="border-b border-border pb-2">
                <p className="text-sm font-medium text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="mt-1 text-base text-foreground font-semibold">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    """
        # Find last </div>
        last_div_idx = content.rfind("</div>\n  );")
        if last_div_idx != -1:
            content = content[:last_div_idx] + sheet_code + content[last_div_idx:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
for file in files:
    try:
        process_file(file)
        print(f"Processed {file}")
    except Exception as e:
        print(f"Error processing {file}: {e}")
