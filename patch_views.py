import sys
with open('src/pages/GenericModulePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
import_lucide = 'import { Sparkles, Plus, RefreshCw, BarChart2, ShieldCheck, FileText, Table, Trello, Calendar, Clock, BarChart, Users, Grid, FileSpreadsheet, Filter, PieChart } from "lucide-react";'
content = content.replace('import { Sparkles, Plus, RefreshCw, BarChart2, ShieldCheck, FileText } from "lucide-react";', import_lucide)

# 2. Add activeView state
state_code = '''
  const [activeView, setActiveView] = useState('default');
'''
content = content.replace('const [isSettingsOpen, setIsSettingsOpen] = useState(false);', 'const [isSettingsOpen, setIsSettingsOpen] = useState(false);' + state_code)

# 3. Add the view tabs UI
tabs_ui = '''
      {/* 10 Views Switcher */}
      {moduleDef && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide border-b border-border">
          {[
            { id: 'default', label: 'Default', icon: Sparkles },
            { id: 'table', label: 'Table', icon: Table },
            { id: 'kanban', label: 'Kanban', icon: Trello },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'analytics', label: 'Analytics', icon: BarChart },
            { id: 'directory', label: 'Directory', icon: Users },
            { id: 'gallery', label: 'Gallery', icon: Grid },
            { id: 'spreadsheet', label: 'Spreadsheet', icon: FileSpreadsheet },
            { id: 'pipeline', label: 'Pipeline', icon: Filter },
            { id: 'report', label: 'Report', icon: PieChart }
          ].map(view => {
            const Icon = view.icon;
            const isActive = activeView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={lex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition-colors }
              >
                <Icon className="w-4 h-4" />
                {view.label}
              </button>
            );
          })}
        </div>
      )}
'''
# We will insert tabs_ui right before {renderModuleContent()}
content = content.replace('{renderModuleContent()}', tabs_ui + '\n      {renderModuleContent()}')

# 4. Modify renderModuleContent switch
switch_orig = 'switch (pageType) {'
switch_new = '''
    const currentView = activeView === 'default' ? pageType : activeView;
    switch (currentView) {
      case 'analytics':
'''
content = content.replace('switch (pageType) {', switch_new)

with open('src/pages/GenericModulePage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
