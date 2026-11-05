import { List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ViewToggle({ view = 'list' }) {
  return (
    <div className="flex bg-muted/50 p-1 rounded-lg border border-border" aria-label="View mode">
      <Button variant="ghost" size="sm" className="h-8 px-3 rounded-md bg-background shadow-sm text-foreground" title="List View" aria-pressed="true">
        <List className="w-4 h-4 mr-2" />
        List
      </Button>
    </div>
  );
}
