import React from 'react';
import { useTranslation } from 'react-i18next';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Plus, Search, Filter } from 'lucide-react';

export default function SHSParentProgress() {
  const { t } = useTranslation();

  const dummyData = [
    { id: 1, name: "Sample Record A", status: "Active", date: "2024-03-15" },
    { id: 2, name: "Sample Record B", status: "Pending", date: "2024-03-14" },
    { id: 3, name: "Sample Record C", status: "Completed", date: "2024-03-12" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleBanner 
        title="Student Progress"
        subtitle="Academic performance view for parents."
        metrics={[
          { title: "Total Records", value: "1,248", icon: LineChart },
          { title: "Active", value: "982", icon: LineChart },
          { title: "Pending Review", value: "45", icon: LineChart }
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-64"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        <Button className="bg-[#6F00FF] hover:bg-[#5200c2] text-white">
          <Plus className="w-4 h-4 mr-2" /> Add New
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyData.map((item) => (
          <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6F00FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LineChart className="w-6 h-6" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  item.status === 'Active' ? 'bg-purple-100 text-purple-700' :
                  item.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {item.status}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1 text-foreground">{item.name}</h3>
              <p className="text-sm text-muted-foreground font-medium">Last updated: {item.date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
