import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import { Button} from "@/components/ui/button";
import { BarChart, TrendingUp, Download, Calendar, Activity, Eye} from "lucide-react";
import { Progress} from "@/components/ui/progress";

export default function OnlineAnalytics() {
 return (
 <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h1 className="text-3xl font-semibold text-gray-900 tracking-[-0.02em]">Platform Analytics</h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1">Deep insights into student engagement, completion rates, and revenue.</p>
 </div>
 <div className="flex gap-4">
 <Button variant="outline" className="bg-white dark:bg-card/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"><Calendar className="h-4 w-4 mr-2" /> Last 30 Days</Button>
 <Button className="bg-primary hover:bg-primary/90 text-white"><Download className="h-4 w-4 mr-2" /> Export Report</Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <Card className="border-0 rounded-xl">
 <CardContent className="p-6">
 <div className="flex items-center space-x-4">
 <div className="p-3 bg-slate-50 dark:bg-secondary/50 text-primary rounded-xl">
 <Eye className="h-6 w-6" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Page Views</p>
 <div className="flex items-end gap-2">
 <h3 className="text-2xl font-semibold text-gray-900 tracking-[-0.02em]">125k</h3>
 <span className="text-sm font-medium text-primary mb-1">+24%</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 
 <Card className="border-0 rounded-xl">
 <CardContent className="p-6">
 <div className="flex items-center space-x-4">
 <div className="p-3 bg-slate-50 dark:bg-secondary/50 text-primary rounded-xl">
 <BarChart className="h-6 w-6" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Conversion Rate</p>
 <div className="flex items-end gap-2">
 <h3 className="text-2xl font-semibold text-gray-900 tracking-[-0.02em]">4.2%</h3>
 <span className="text-sm font-medium text-primary mb-1">+1.1%</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="border-0 rounded-xl">
 <CardContent className="p-6">
 <div className="flex items-center space-x-4">
 <div className="p-3 bg-slate-50 dark:bg-secondary/50 text-primary rounded-xl">
 <Activity className="h-6 w-6" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">Avg Completion</p>
 <div className="flex items-end gap-2">
 <h3 className="text-2xl font-semibold text-gray-900 tracking-[-0.02em]">68%</h3>
 <span className="text-sm font-medium text-[#71717a] dark:text-gray-400 mb-1">Steady</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="border-0 rounded-xl">
 <CardContent className="p-6">
 <div className="flex items-center space-x-4">
 <div className="p-3 bg-slate-50 dark:bg-secondary/50 text-primary rounded-xl">
 <TrendingUp className="h-6 w-6" />
 </div>
 <div>
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400">ARR (Est)</p>
 <div className="flex items-end gap-2">
 <h3 className="text-2xl font-semibold text-gray-900 tracking-[-0.02em]">$1.2M</h3>
 <span className="text-sm font-medium text-primary mb-1">+15%</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
 <Card className="border-0 rounded-xl">
 <CardHeader>
 <CardTitle className="text-xl">Student Engagement</CardTitle>
 <CardDescription>Daily active users over the last 30 days.</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="h-[300px] w-full flex items-center justify-center border-2 border-dashed border-primary/40 rounded-xl mt-4">
 <p className="text-sm text-[#71717a] dark:text-gray-400">Not enough data to display chart.</p>
 </div>
 </CardContent>
 </Card>

 <Card className="border-0 rounded-xl">
 <CardHeader>
 <CardTitle className="text-xl">Course Completion Rates</CardTitle>
 <CardDescription>Percentage of enrolled students who finished the course.</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="flex items-center justify-center py-12 border-2 border-dashed border-primary/40 rounded-xl mt-4">
 <p className="text-sm text-[#71717a] dark:text-gray-400">No course data available.</p>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
