import React from 'react';
import { 
  Users, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  AlertTriangle,
  Activity,
  BrainCircuit
} from 'lucide-react';

const HRAnalytics = () => {
  const metrics = [
    {
      title: "Employee Retention",
      value: "92.4%",
      trend: "+2.1%",
      trendUp: true,
      icon: <Users className="w-6 h-6 text-blue-500" />,
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Diversity Index",
      value: "68.5",
      trend: "+5.4",
      trendUp: true,
      icon: <PieChart className="w-6 h-6 text-purple-500" />,
      color: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "Pay Equity Gap",
      value: "1.2%",
      trend: "-0.5%",
      trendUp: true, // a decrease in pay gap is a positive outcome
      icon: <DollarSign className="w-6 h-6 text-emerald-500" />,
      color: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "Avg Time to Hire",
      value: "24 Days",
      trend: "-3 Days",
      trendUp: true,
      icon: <TrendingUp className="w-6 h-6 text-amber-500" />,
      color: "bg-amber-50 dark:bg-amber-900/20"
    }
  ];

  const flightRisks = [
    { id: 1, name: "Sarah Jenkins", role: "Senior Developer", department: "Engineering", riskScore: 88, reason: "Below market comp, 3 yrs no promo" },
    { id: 2, name: "Michael Chen", role: "Product Manager", department: "Product", riskScore: 82, reason: "High burnout indicator, recent manager change" },
    { id: 3, name: "Elena Rodriguez", role: "UX Designer", department: "Design", riskScore: 76, reason: "Low engagement in recent pulse surveys" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-600" />
            HR Analytics & AI
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Data-driven insights and predictive modeling for workforce management.
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
          <BrainCircuit className="w-4 h-4" />
          Run AI Analysis
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                {metric.icon}
              </div>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                metric.trendUp 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {metric.trend}
              </span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{metric.title}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* AI Flight Risk Predictor Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-white dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Flight Risk Predictor</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Our predictive model has identified the following top talents with a high probability of turnover within the next 90 days.
          </p>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {flightRisks.map((employee) => (
            <div key={employee.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300">
                      {employee.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{employee.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{employee.role} • {employee.department}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 px-2.5 py-1 rounded-md">
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Risk Factor: {employee.reason}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{employee.riskScore}%</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Risk Score</div>
                  </div>
                  <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                    Intervene
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-center">
          <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
            View All Predictions &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRAnalytics;
