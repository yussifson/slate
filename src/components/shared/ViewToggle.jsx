import { LayoutGrid, List, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A toggle component to switch between view modes (grid, list, kanban).
 * 
 * @param {string} view - The current view ('grid', 'list', 'kanban')
 * @param {function} onViewChange - Callback when the view changes
 * @param {Array} allowedViews - Which views are allowed, defaults to ['grid', 'list', 'kanban']
 */
export default function ViewToggle({ view, onViewChange, allowedViews = ['grid', 'list', 'kanban'] }) {
  return (
    <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
      {allowedViews.includes('grid') && (
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-3 rounded-md transition-all ${view === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => onViewChange('grid')}
          title="Grid View"
        >
          <LayoutGrid className="w-4 h-4" />
        </Button>
      )}
      {allowedViews.includes('list') && (
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-3 rounded-md transition-all ${view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => onViewChange('list')}
          title="List View"
        >
          <List className="w-4 h-4" />
        </Button>
      )}
      {allowedViews.includes('kanban') && (
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-3 rounded-md transition-all ${view === 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => onViewChange('kanban')}
          title="Kanban Board"
        >
          <Columns className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
