import { useTranslation } from "react-i18next";
import { X, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SavedViewsTabs — manage filter tabs
 * Props:
 *   views: [{id, name, filters}]
 *   activeViewId: string
 *   onSelectView: (view) => void
 *   onSaveCurrentView: () => void
 *   onDeleteView: (id) => void
 *   isLoading: boolean
 */
export default function SavedViewsTabs({
  views = [],
  activeViewId = 'all',
  onSelectView,
  onSaveCurrentView,
  onDeleteView,
  isLoading
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
      <button
        onClick={() => onSelectView({ id: 'all', name: 'All Records', filters: [] })}
        className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
          activeViewId === 'all'
            ? 'border-primary text-primary'
            : 'border-transparent text-[#71717a] dark:text-gray-400 hover:text-foreground hover:border-muted-foreground/30'
        }`}
      >
        {t("all_records", "All Records")}
      </button>
      {views.map(view => {
        return (
          <div key={view.id} className="relative group flex items-center">
            <button
              onClick={() => onSelectView(view)}
              className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors pr-8 ${
                activeViewId === view.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#71717a] dark:text-gray-400 hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              {view.name}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteView(view.id); }}
              className="absolute right-1 w-5 h-5 rounded-md-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#71717a] dark:text-gray-400 hover:bg-muted hover:text-red-500"
              title="Delete saved view"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSaveCurrentView}
        disabled={isLoading}
        className="h-8 px-2 text-[#71717a] dark:text-gray-400 hover:text-primary shrink-0 ml-1"
        title="Save current filters as new view"
      >
        <Save className="w-4 h-4 mr-1.5" />
        <span className="text-xs tracking-[0.04em]">{t("save_view", "Save View")}</span>
      </Button>
    </div>
  );
}
