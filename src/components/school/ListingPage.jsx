import { useState, useMemo } from 'react';
import { Search, Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

export default function ListingPage({
  data = [],
  columns = [],
  onAdd,
  onEdit,
  onDelete,
  searchPlaceholder = "Search...",
  onSearch,
  filterOptions = {},
  view = 'list',
  onViewChange,
  loading = false,
  emptyIcon: EmptyIcon,
  emptyMessage = "No records found",
  cardRender = null,
  renderRow = null
}) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const filteredData = useMemo(() => {
    let result = data;

    if (search) {
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        result = result.filter(item => item[key] === value);
      }
    });

    return result;
  }, [data, search, filters]);

  const handleSearch = (value) => {
    setSearch(value);
    onSearch?.(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(filterOptions).map(([key, options]) => (
            <Select key={key} value={filters[key] || 'All'} onValueChange={(value) => setFilters({ ...filters, [key]: value })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {options.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {onAdd && (
            <Button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl border-border">
          {EmptyIcon && <EmptyIcon className="w-16 h-16 text-muted-foreground/20 mb-4" />}
          <p className="text-muted-foreground text-lg">{emptyMessage}</p>
          {onAdd && (
            <Button onClick={onAdd} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Record
            </Button>
          )}
        </div>
      ) : view === 'grid' && cardRender ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredData.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.05 }}
              >
                {cardRender(item)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="text-left p-4 font-semibold text-foreground">{col.header}</th>
                  ))}
                  {(onEdit || onDelete) && <th className="text-right p-4 font-semibold text-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence>
                  {filteredData.map((item, idx) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {renderRow ? (
                        renderRow(item)
                      ) : (
                        <>
                          {columns.map((col, cidx) => (
                            <td key={cidx} className="p-4">
                              {col.cell ? col.cell(item) : item[col.accessorKey]}
                            </td>
                          ))}
                        </>
                      )}
                      {(onEdit || onDelete) && (
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(item)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
