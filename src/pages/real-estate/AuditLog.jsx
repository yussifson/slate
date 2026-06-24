import React, { useState, useEffect } from 'react';
import { useCompanyId } from '../../hooks/useCompanyId';
import AnalyticsAPI from '../../api/RealEstateAnalytics';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    resourceType: '',
    action: ''
  });
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsAPI.getAuditLog(companyId, filters);
        setLogs(data);
      } catch (error) {
        console.error('Error loading audit log:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId, filters]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Audit Log</h1>
        <p className="text-muted-foreground">Track all changes and activities in the system</p>
      </div>

      <div className="mb-6 p-4 bg-card border border-border rounded-lg flex gap-4">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground block mb-2">Resource Type</label>
          <input
            type="text"
            placeholder="Filter by resource type..."
            value={filters.resourceType}
            onChange={(e) => setFilters({...filters, resourceType: e.target.value})}
            className="w-full px-3 py-2 border border-border rounded text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm text-muted-foreground block mb-2">Action</label>
          <input
            type="text"
            placeholder="Filter by action..."
            value={filters.action}
            onChange={(e) => setFilters({...filters, action: e.target.value})}
            className="w-full px-3 py-2 border border-border rounded text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="bg-accent">
              <th className="text-left py-3 px-4">Timestamp</th>
              <th className="text-left py-3 px-4">User ID</th>
              <th className="text-left py-3 px-4">Action</th>
              <th className="text-left py-3 px-4">Resource Type</th>
              <th className="text-left py-3 px-4">Resource ID</th>
              <th className="text-left py-3 px-4">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-muted-foreground">No audit logs found</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="border-b border-border hover:bg-accent">
                  <td className="py-3 px-4 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-xs">{log.user_id.substring(0, 8)}...</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.action === 'create' ? 'bg-green-100 text-green-800' :
                      log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'delete' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">{log.resource_type}</td>
                  <td className="py-3 px-4 font-mono text-xs">{log.resource_id.substring(0, 8)}...</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{log.ip_address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
