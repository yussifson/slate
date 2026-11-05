import { useState, useEffect } from 'react';

/**
 * Hook for the supported list and kanban view modes.
 * @param {string} moduleKey - The unique key for the module (e.g. 'pharmacy_customers')
 * @param {string} defaultView - Kept for backwards compatibility; list is always the default
 */
export function useViewPreference(moduleKey, defaultView = 'list') {
  const [view, setView] = useState('list');

  useEffect(() => {
    setView('list');
  }, [moduleKey]);

  const changeView = (nextView) => {
    setView(nextView === 'kanban' ? 'kanban' : 'list');
  };

  return [view, changeView];
}
