import React from 'react';
import { useQuery } from '@powersync/react';
import { User, Clock, AlertTriangle, MonitorPlay, CheckCircle2 } from 'lucide-react';

export default function OPDQueue() {
  const { data: queues = [], isLoading } = useQuery('SELECT * FROM univ_opd_queues ORDER BY created_at ASC');

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading OPD Queues...</div>;
  }

  const waiting = queues.filter(q => q.status === 'waiting');
  const called = queues.filter(q => q.status === 'called_in' || q.status === 'in_consultation');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">OPD Display Board & Queue</h2>
          <p className="text-sm text-gray-500">Live patient tracking and queue management</p>
        </div>
        <button className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/80 dark:hover:bg-white/80 transition-colors shadow-sm">
          <MonitorPlay className="h-4 w-4" />
          <span>Launch Display Board</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active / Called Board */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-4 bg-green-50/80 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Currently Calling
              </h3>
            </div>
            <div className="p-4 space-y-3 flex-1 bg-white/50 dark:bg-black/50">
              {called.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2 opacity-60">
                  <CheckCircle2 className="h-8 w-8" />
                  <p className="text-sm">No active consultations</p>
                </div>
              ) : (
                called.map(item => (
                  <div key={item.id} className="p-4 rounded-xl border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/10 flex items-center justify-between shadow-sm">
                    <div>
                      <div className="text-3xl font-bold font-mono tracking-wider text-green-950 dark:text-green-50">
                        {item.token_number || item.id.substring(0,4)}
                      </div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-300/80">Dr. {item.doctor_id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-700 dark:text-green-400">Room {item.room_number || '1'}</div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-green-600 dark:text-green-500 mt-1 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full inline-block">
                        {item.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Waiting Queue */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm overflow-hidden h-full">
            <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
              <h3 className="text-lg font-medium flex items-center justify-between">
                <span>Waiting Queue</span>
                <span className="text-sm font-normal text-gray-500">{waiting.length} waiting</span>
              </h3>
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/5 max-h-[600px] overflow-y-auto">
              {waiting.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-gray-500 space-y-3 opacity-60">
                  <User className="h-10 w-10" />
                  <p className="text-sm">Queue is empty</p>
                </div>
              ) : (
                waiting.map((item, index) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center font-bold text-lg text-gray-700 dark:text-gray-300">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Token: <span className="font-mono">{item.token_number || item.id.substring(0,6)}</span></div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" />
                          <span>Patient {item.patient_id?.substring(0,8)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 sm:space-x-6">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium">Dept: {item.department || 'General'}</div>
                        <div className="text-xs text-gray-500 flex items-center justify-end gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>Wait: ~15m</span>
                        </div>
                      </div>
                      
                      {/* Intelligence / Prediction badges */}
                      {parseFloat(item.no_show_risk_score) > 70 && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-800/50 shadow-sm">
                          <AlertTriangle className="h-3 w-3" />
                          <span>High No-Show Risk</span>
                        </div>
                      )}
                      {parseFloat(item.no_show_risk_score) > 40 && parseFloat(item.no_show_risk_score) <= 70 && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800/50 shadow-sm">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Med No-Show Risk</span>
                        </div>
                      )}

                      <button className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-black/80 dark:hover:bg-white/80 transition-colors whitespace-nowrap shadow-sm">
                        Call In
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
