import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function IconPicker({ value, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Extract a list of commonly used icons for business apps
  const commonIconNames = [
    'Blocks', 'Users', 'Settings', 'Briefcase', 'Folder', 'FileText', 'Calendar',
    'Truck', 'Heart', 'Building', 'Activity', 'BarChart', 'BarChart2', 'Bell',
    'Book', 'Bookmark', 'Box', 'Camera', 'CheckCircle', 'Clipboard', 'Clock',
    'Cloud', 'Code', 'Coffee', 'Compass', 'CreditCard', 'Database', 'DollarSign',
    'Edit', 'Eye', 'Feather', 'Filter', 'Flag', 'Gift', 'Globe', 'Headphones',
    'Home', 'Image', 'Inbox', 'Info', 'Key', 'Layers', 'Layout', 'Link', 'List',
    'Lock', 'Mail', 'Map', 'MessageCircle', 'MessageSquare', 'Monitor', 'Package',
    'Paperclip', 'Phone', 'PieChart', 'Printer', 'Radio', 'Save', 'Search',
    'Send', 'Server', 'Shield', 'ShoppingBag', 'ShoppingCart', 'Smartphone',
    'Smile', 'Star', 'Sun', 'Tablet', 'Tag', 'Target', 'Tool', 'Trash',
    'TrendingUp', 'Type', 'Umbrella', 'Unlock', 'Upload', 'User', 'UserCheck',
    'UserPlus', 'Users', 'Video', 'Volume', 'Watch', 'Wifi', 'Zap'
  ];

  const filteredIcons = commonIconNames.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CurrentIcon = LucideIcons[value] || LucideIcons.Blocks;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full flex items-center justify-start gap-3 h-10 px-3 bg-background font-normal border-input text-foreground">
          <CurrentIcon className="w-5 h-5 text-primary" />
          <span className="flex-1 text-left">{value || "Select Icon"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-[250px] overflow-y-auto p-2">
          <div className="grid grid-cols-5 gap-2">
            {filteredIcons.length > 0 ? (
              filteredIcons.map((name) => {
                const IconComp = LucideIcons[name];
                return (
                  <button
                    key={name}
                    title={name}
                    className={`flex aspect-square items-center justify-center rounded-md border transition-colors hover:bg-primary/10 hover:text-primary ${value === name ? 'bg-primary/15 border-primary text-primary' : 'bg-transparent border-transparent text-muted-foreground'}`}
                    onClick={() => {
                      onChange(name);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })
            ) : (
              <div className="col-span-5 text-center text-sm text-muted-foreground py-4">
                No icons found.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
