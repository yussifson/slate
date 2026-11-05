import { List, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ViewToggle({ view = 'list', onViewChange, allowedViews = ['list', 'kanban'] }) {
  return (
    <div className="flex bg-muted/50 p-1 rounded-lg border border-border" aria-label="View mode">
      {allowedViews.includes('list') && <Button variant="ghost" size="sm" className={`h-8 px-3 rounded-md ${view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => onViewChange?.('list')} title="List View" aria-pressed={view === 'list'}><List className="w-4 h-4 mr-2" />List</Button>}
      {allowedViews.includes('kanban') && <Button variant="ghost" size="sm" className={`h-8 px-3 rounded-md ${view === 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => onViewChange?.('kanban')} title="Kanban Board" aria-pressed={view === 'kanban'}><Columns className="w-4 h-4 mr-2" />Kanban</Button>}
    </div>
  );
}
