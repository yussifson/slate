import React, { useState, useEffect } from 'react';
import { useCompanyId } from '../../hooks/useCompanyId';
import { RealEstateAnalytics } from '../../api/RealEstateAnalytics';
import { useViewPreference } from '@/hooks/useViewPreference';
import ViewToggle from '@/components/shared/ViewToggle';

export default function ClientScoring() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useViewPreference('re_clientscoring', 'grid');
  const companyId = useCompanyId();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await RealEstateAnalytics.getClientScoring(companyId);
        setScores(data);
      } catch (error) {
        console.error('Error loading client scores:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const scoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Client Scoring</h1>
        <p className="text-muted-foreground">Evaluate client quality and engagement levels</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="bg-accent">
              <th className="text-left py-3 px-4">Client ID</th>
              <th className="text-left py-3 px-4">Score</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-left py-3 px-4">Engagement</th>
              <th className="text-left py-3 px-4">Purchase Propensity</th>
              <th className="text-left py-3 px-4">Last Interaction</th>
              <th className="text-left py-3 px-4">Recommended Agent</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted-foreground">No client scores found</td>
              </tr>
            ) : (
              scores.map(score => (
                <tr key={score.id} className="border-b border-border hover:bg-accent">
                  <td className="py-3 px-4 font-mono text-xs">{score.client_id.substring(0, 8)}...</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded font-bold ${scoreColor(score.score)}`}>
                      {score.score}
                    </span>
                  </td>
                  <td className="py-3 px-4">{score.score_category}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      score.engagement_level === 'high' ? 'bg-green-100' :
                      score.engagement_level === 'medium' ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      {score.engagement_level}
                    </span>
                  </td>
                  <td className="py-3 px-4">{score.purchase_propensity}%</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {score.days_since_last_contact} days ago
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{score.recommended_agent_id?.substring(0, 8) || '-'}...</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
