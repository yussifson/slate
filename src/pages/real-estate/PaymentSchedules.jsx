import React, { useState, useEffect } from 'react';
import { useCompanyId } from '../../hooks/useCompanyId';
import { formatCurrency } from '../../utils/formatters';
import LeaseAPI from '../../api/RealEstateLeaseAutomation';

export default function PaymentSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await LeaseAPI.getRentPaymentSchedules(companyId);
        setSchedules(data);
      } catch (error) {
        console.error('Error loading payment schedules:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Payment Schedules</h1>
        <p className="text-muted-foreground">Configure and manage rent payment schedules</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="bg-accent">
              <th className="text-left py-3 px-4">Lease ID</th>
              <th className="text-left py-3 px-4">Payment Amount</th>
              <th className="text-left py-3 px-4">Due Day</th>
              <th className="text-left py-3 px-4">Grace Period</th>
              <th className="text-left py-3 px-4">Late Fee</th>
              <th className="text-left py-3 px-4">Auto Debit</th>
              <th className="text-left py-3 px-4">Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted-foreground">No payment schedules found</td>
              </tr>
            ) : (
              schedules.map(schedule => (
                <tr key={schedule.id} className="border-b border-border hover:bg-accent">
                  <td className="py-3 px-4 font-mono text-xs">{schedule.lease_id.substring(0, 8)}...</td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(schedule.payment_amount)}</td>
                  <td className="py-3 px-4">Day {schedule.payment_due_date}</td>
                  <td className="py-3 px-4">{schedule.grace_period_days} days</td>
                  <td className="py-3 px-4">
                    {schedule.late_fee_amount ? formatCurrency(schedule.late_fee_amount) : `${schedule.late_fee_percentage}%`}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${schedule.auto_debit_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                      {schedule.auto_debit_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{schedule.payment_method}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
