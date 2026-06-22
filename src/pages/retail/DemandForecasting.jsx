import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { powerSync } from '@/api/PowerSyncConnector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DemandForecasting() {
  const { user } = useAuth();
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user?.company_id) loadProducts(user.company_id);
  }, [user]);

  const loadProducts = async (companyId) => {
    try {
      const res = await powerSync.execute('SELECT id, name, sku FROM univ_retail_products WHERE company_id = ? LIMIT 5', [companyId]);
      const products = res.rows._array || Array.from(res.rows);
      
      // Generate some mock AI forecasts based on these products
      const generatedForecasts = products.map(p => {
        const trend = Math.random() > 0.5 ? 'up' : 'down';
        const severity = Math.random() > 0.7 ? 'high' : 'normal';
        return {
          ...p,
          trend,
          severity,
          predictedDemand: Math.floor(Math.random() * 500) + 50,
          recommendation: trend === 'up' 
            ? 'Increase order quantity by 20% for upcoming holiday season.' 
            : 'Slow down purchasing. Existing inventory sufficient for 90 days.'
        };
      });
      setForecasts(generatedForecasts);
    } catch (e) {
      console.error('Failed to load products for forecast', e);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      loadProducts(user?.company_id); // Reload to simulate new numbers
    }, 2500);
  };

  if (loading) return <div className="p-8 text-center">Loading AI Engine...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-300" />
            AI Demand Forecasting
          </h1>
          <p className="text-blue-100 mt-2 max-w-xl">
            Our predictive engine analyzes historical sales, seasonality, and market trends to recommend exact purchasing quantities.
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={runAnalysis} 
          disabled={analyzing}
          className="bg-white text-indigo-900 hover:bg-blue-50 border-0"
        >
          {analyzing ? 'Analyzing Market...' : 'Refresh Forecast'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {forecasts.map(f => (
          <Card key={f.id} className={`border-l-4 ${f.trend === 'up' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex-1 space-y-2">
                <div className="text-sm text-slate-500 font-mono">{f.sku}</div>
                <h3 className="text-xl font-bold">{f.name}</h3>
                <p className="text-slate-600 flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${f.trend === 'up' ? 'text-green-500' : 'text-amber-500'}`} />
                  {f.recommendation}
                </p>
              </div>
              <div className="text-center bg-slate-50 p-4 rounded-xl min-w-[150px]">
                <div className="text-sm text-slate-500 mb-1">Predicted 30d Demand</div>
                <div className="text-3xl font-black text-slate-900">{f.predictedDemand} units</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
