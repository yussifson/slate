import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, TrendingUp, Download, Calendar, Activity, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function OnlineAnalytics() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-500 mt-1">Deep insights into student engagement, completion rates, and revenue.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="bg-white"><Calendar className="h-4 w-4 mr-2" /> Last 30 Days</Button>
          <Button className="bg-[#0056D2] hover:bg-[#004bb5] text-white"><Download className="h-4 w-4 mr-2" /> Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-[#0056D2] rounded-lg">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Page Views</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">125k</h3>
                  <span className="text-sm font-medium text-green-600 mb-1">+24%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <BarChart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">4.2%</h3>
                  <span className="text-sm font-medium text-green-600 mb-1">+1.1%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Completion</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">68%</h3>
                  <span className="text-sm font-medium text-gray-500 mb-1">Steady</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ARR (Est)</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">$1.2M</h3>
                  <span className="text-sm font-medium text-green-600 mb-1">+15%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Student Engagement</CardTitle>
            <CardDescription>Daily active users over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl mt-4">
              <p className="text-sm text-gray-500">Not enough data to display chart.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Course Completion Rates</CardTitle>
            <CardDescription>Percentage of enrolled students who finished the course.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl mt-4">
              <p className="text-sm text-gray-500">No course data available.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
