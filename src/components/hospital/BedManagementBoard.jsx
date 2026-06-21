import React from 'react';
import { useQuery } from '@powersync/react';
import { Bed, Activity, User, Plus } from 'lucide-react';

export default function BedManagementBoard() {
  const { data: wards = [], isLoading: isLoadingWards } = useQuery('SELECT * FROM univ_wards ORDER BY name ASC');
  const { data: beds = [], isLoading: isLoadingBeds } = useQuery('SELECT * FROM univ_beds ORDER BY bed_number ASC');

  if (isLoadingWards || isLoadingBeds) {
    return <div className="p-4 text-sm text-gray-500">Loading bed management...</div>;
  }

  // Group beds by ward
  const bedsByWard = wards.map(ward => ({
    ...ward,
    beds: beds.filter(b => b.ward_id === ward.id)
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Bed Management</h2>
          <p className="text-sm text-gray-500">Live ward and bed capacity tracking</p>
        </div>
        <button className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/80 dark:hover:bg-white/80 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Bed</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bedsByWard.map(ward => (
          <div key={ward.id} className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
              <h3 className="text-lg font-medium">{ward.name}</h3>
              <p className="text-sm text-gray-500">
                Capacity: {ward.beds.length} | Available: {ward.beds.filter(b => b.status === 'available').length}
              </p>
            </div>
            <div className="p-4 flex-1 grid grid-cols-2 gap-3 overflow-y-auto max-h-96">
              {ward.beds.map(bed => (
                <div 
                  key={bed.id} 
                  className={`relative p-3 rounded-xl border-[0.5px] shadow-sm flex flex-col items-center justify-center text-center space-y-2 transition-all
                    ${bed.status === 'available' ? 'bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
                    ${bed.status === 'occupied' ? 'bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}
                    ${bed.status === 'cleaning' ? 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : ''}
                    ${bed.status === 'maintenance' ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : ''}
                  `}
                >
                  <Bed className={`h-6 w-6 ${
                    bed.status === 'available' ? 'text-green-600 dark:text-green-400' :
                    bed.status === 'occupied' ? 'text-red-600 dark:text-red-400' :
                    bed.status === 'cleaning' ? 'text-amber-600 dark:text-amber-400' :
                    'text-gray-500'
                  }`} />
                  <div className="text-sm font-semibold">{bed.bed_number}</div>
                  <div className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/5">
                    {bed.status}
                  </div>
                  {bed.patient_id && (
                    <div className="mt-2 flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-[80px]">{bed.patient_id.substring(0,6)}...</span>
                    </div>
                  )}
                  {bed.is_abnormal === 'true' && (
                    <div className="absolute top-2 right-2 flex space-x-1" title="Abnormal vitals detected">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
                    </div>
                  )}
                </div>
              ))}
              {ward.beds.length === 0 && (
                <div className="col-span-2 py-8 text-center text-sm text-gray-500">No beds configured for this ward</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
