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

def process_file(filename):
    path = os.path.join(DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the delete button pattern
    # It looks like: <Button ... onClick={() => setDeleteTargetId(m.id)} ...> ... <Trash2 ... /> ... </Button>
    
    # We need to extract the variable name from setDeleteTargetId(XXX.id)
    pattern = re.compile(r'<Button[^>]*onClick=\{\(\)\s*=>\s*setDeleteTargetId\(([^.]+)\.id\)\}[^>]*>.*?<Trash2.*?/Button>', re.DOTALL)
    
    def replacer(match):
        var_name = match.group(1)
        return f"""<DropdownMenu>
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
                      </DropdownMenu>"""
                      
    if "DropdownMenuContent" not in content:
        content = pattern.sub(replacer, content)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
for file in files:
    try:
        process_file(file)
        print(f"Processed {file}")
    except Exception as e:
        print(f"Error processing {file}: {e}")
