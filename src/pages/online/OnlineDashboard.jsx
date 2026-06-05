import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, TrendingUp, DollarSign, Award, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function OnlineDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, Instructor</h1>
          <p className="text-gray-500 mt-1">Here is what's happening with your courses today.</p>
        </div>
        <Button className="bg-[#0056D2] hover:bg-[#004bb5] text-white">Create New Course</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">$45,231.89</div>
            <p className="text-xs text-green-600 font-medium flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" /> +20.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-4">
              <p className="text-sm font-medium text-gray-500">Active Students</p>
              <div className="w-10 h-10 bg-blue-50 text-[#0056D2] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">+2,350</div>
            <p className="text-xs text-green-600 font-medium flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" /> +180 since last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-4">
              <p className="text-sm font-medium text-gray-500">Course Sales</p>
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">+12,234</div>
            <p className="text-xs text-green-600 font-medium flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" /> +19% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-4">
              <p className="text-sm font-medium text-gray-500">Avg. Engagement</p>
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">4h 12m</div>
            <p className="text-xs text-gray-500 font-medium mt-2">
              Time spent per user/week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2 border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Top Performing Courses</CardTitle>
            <CardDescription>Overview of your highest grossing courses this quarter.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { title: "Machine Learning Specialization", students: 12450, rev: "$124k", prog: 85 },
                { title: "React Web Development", students: 8200, rev: "$82k", prog: 60 },
                { title: "Data Science with Python", students: 6400, rev: "$64k", prog: 45 },
              ].map((c, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <BookOpen className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none text-gray-900">{c.title}</p>
                    <p className="text-sm text-gray-500">{c.students.toLocaleString()} Students • {c.rev} Revenue</p>
                  </div>
                  <div className="w-24">
                    <Progress value={c.prog} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Recent Enrollments</CardTitle>
            <CardDescription>Latest students who joined your courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: "Alex Johnson", course: "Machine Learning", time: "2 hours ago", initials: "AJ" },
                { name: "Sarah Smith", course: "React Web Development", time: "4 hours ago", initials: "SS" },
                { name: "Michael Brown", course: "Data Science", time: "5 hours ago", initials: "MB" },
                { name: "Emily Davis", course: "Machine Learning", time: "1 day ago", initials: "ED" },
              ].map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-[#0056D2] font-semibold text-sm mr-4">
                    {s.initials}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">Enrolled in {s.course}</p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-gray-400">{s.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
