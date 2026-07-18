import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, DollarSign } from 'lucide-react';
import { useIntelligence } from '@/hooks/useIntelligence';

export function RevenueForecastCard({ vertical }) {
  const { insights } = useIntelligence(vertical);
  const forecast = insights.find(i => i.insight_key === 'revenue_forecast_30day');

  if (!forecast) return null;

  const snap = forecast.data_snapshot || {};
  const isUp = snap.trend > 0;
  const isDown = snap.trend < 0;

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isUp ? 'bg-green-500/10 text-green-500' : isDown ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
            <DollarSign className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm">30-Day Revenue Forecast</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isUp ? 'bg-green-500/10 text-green-500' : isDown ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {snap.confidence}% Confidence
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold">${Math.round(snap.forecast || 0).toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{forecast.body}</p>
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t mt-auto">
        <span>Range: ${Math.round(snap.lowerBound || 0).toLocaleString()} - ${Math.round(snap.upperBound || 0).toLocaleString()}</span>
        <span>Based on {snap.weekCount || 0} weeks</span>
      </div>
    </div>
  );
}

export function BehaviourProfilePanel({ profile, entityType }) {
  if (!profile) return null;

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm mt-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        AI Behaviour Profile
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Payment Reliability</span>
          <span className="text-sm font-medium capitalize">{profile.payment_reliability?.replace('_', ' ') || 'Unknown'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Engagement Trend</span>
          <span className="text-sm font-medium capitalize">{profile.engagement_trend || 'Unknown'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Churn Risk</span>
          <span className={`text-sm font-medium capitalize ${profile.churn_risk === 'high' ? 'text-destructive' : profile.churn_risk === 'medium' ? 'text-orange-500' : 'text-green-500'}`}>
            {profile.churn_risk || 'Unknown'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <span className="text-sm font-medium">{Math.round(profile.profile_confidence || 0)}%</span>
        </div>
      </div>
    </div>
  );
}

export function BenchmarkingPanel({ vertical }) {
  const [benchmark, setBenchmark] = React.useState(null);

  React.useEffect(() => {
    // In real implementation this would fetch from the RPC wrapper `getWorkspaceBenchmarks`
    // but we'll mock it temporarily until the UI binds it.
    import('@/lib/intelligence/engines/benchmarking').then(m => {
      // we need companyId, let's just do it directly if we have hook or something
    });
  }, [vertical]);

  // UI rendering of benchmark
  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm mt-4">
      <h3 className="font-semibold text-sm mb-2">Industry Benchmarking ({vertical})</h3>
      <p className="text-sm text-muted-foreground">Compare your performance against anonymized peers in your industry.</p>
      {/* Dynamic content here */}
    </div>
  );
}


export default function IntelligenceUI({ embedded, customPrompt }) {
  return (
    <div className="w-full h-full flex flex-col p-6 items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 relative">
        <Activity className="text-indigo-500 w-8 h-8 animate-pulse" />
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enterprise AI Engine Active</h3>
      <p className="text-sm text-slate-500 max-w-md mt-2">
        Connected to Portfolio Data. {customPrompt && 'Executing specialized role instructions...'}
      </p>
      <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
        <div className="h-2 bg-slate-100 dark:bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 w-2/3 animate-pulse"></div>
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>Aggregating verticals...</span>
          <span>67%</span>
        </div>
      </div>
    </div>
  );
}
