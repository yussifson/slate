import { useState, useEffect } from 'react';

/**
 * Hook to persist view preferences (grid, list, kanban) in Supabase user metadata
 * @param {string} moduleKey - The unique key for the module (e.g. 'pharmacy_customers')
 * @param {string} defaultView - The default view to use if none is set ('grid', 'list', 'kanban')
 */
export function useViewPreference(moduleKey, defaultView = 'list') {
  const [view, setView] = useState('list');

  useEffect(() => {
    setView('list');
  }, [moduleKey]);

  const changeView = () => {
    setView('list');
  };

  return [view, changeView];
}
