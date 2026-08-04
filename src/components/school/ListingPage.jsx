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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 rounded-xl border border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(filterOptions).map(([key, options]) => (
            <Select key={key} value={filters[key] || 'All'} onValueChange={(value) => setFilters({ ...filters, [key]: value })}>
              <SelectTrigger className="w-40 rounded-full border border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800">
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
            <Button onClick={onAdd} className="bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-95 text-white shadow-md font-semibold px-6 py-2 rounded-full transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)] border-0">
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-[2rem] border-[#E4DFD5] dark:border-zinc-800">
          {EmptyIcon && <EmptyIcon className="w-16 h-16 text-zinc-300 mb-4" />}
          <p className="text-zinc-500 text-lg">{emptyMessage}</p>
          {onAdd && (
            <Button onClick={onAdd} variant="outline" className="mt-4 rounded-full border-[#E4DFD5] dark:border-zinc-700 bg-white hover:bg-[#FAF8F5]">
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
        <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800/80 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.02)] rounded-[2rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF8F5] dark:bg-zinc-800/50 border-b border-[#F0EBE1] dark:border-zinc-800/80">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="text-left p-5 font-semibold text-[#1F1E1C] dark:text-zinc-200">{col.header}</th>
                  ))}
                  {(onEdit || onDelete) && <th className="text-right p-5 font-semibold text-[#1F1E1C] dark:text-zinc-200">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1] dark:divide-zinc-800/80">
                <AnimatePresence>
                  {filteredData.map((item, idx) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-[#FAF8F5]/60 dark:hover:bg-zinc-800/20 transition-colors group"
                    >
                      {renderRow ? (
                        renderRow(item)
                      ) : (
                        <>
                          {columns.map((col, cidx) => (
                            <td key={cidx} className="p-5 font-medium text-zinc-700 dark:text-zinc-300">
                              {col.cell ? col.cell(item[col.accessorKey], item) : item[col.accessorKey]}
                            </td>
                          ))}
                        </>
                      )}
                      {(onEdit || onDelete) && (
                        <td className="p-5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-zinc-800">
                                <MoreVertical className="w-4 h-4 text-zinc-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-xl shadow-xl">
                              {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer font-semibold rounded-lg hover:bg-slate-50">
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem onClick={() => onDelete(item)} className="text-rose-600 font-semibold cursor-pointer rounded-lg hover:bg-rose-50">
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
