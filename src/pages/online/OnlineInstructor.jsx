import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, BookOpen, Star, TrendingUp, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function OnlineInstructor() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Portal</h1>
          <p className="text-gray-500 mt-1">Manage your courses, view student analytics, and track revenue.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">Create New Course</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-primary rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">4,250</h3>
                  <span className="text-sm font-medium text-primary mb-1">+12%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-primary rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">$84,520</h3>
                  <span className="text-sm font-medium text-primary mb-1">+5.4%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
                  <span className="text-sm font-medium text-gray-500 mb-1">(342 reviews)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Course Management</CardTitle>
              <CardDescription>Performance of your published courses.</CardDescription>
            </div>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { title: "React Native Mastery", students: 1200, rev: "$24k", rating: 4.9, status: "Active" },
                { title: "Advanced Node.js", students: 850, rev: "$17k", rating: 4.7, status: "Active" },
                { title: "Python for Data Science", students: 2200, rev: "$43k", rating: 4.8, status: "Active" },
              ].map((c, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{c.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.students}</span>
                        <span className="flex items-center gap-1 text-yellow-500"><Star className="h-3 w-3 fill-current" /> {c.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="font-bold text-gray-900">{c.rev}</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-primary border-primary">Manage</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Student Drop-off Analysis</CardTitle>
            <CardDescription>Where students are getting stuck.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Slate 1: Setup</span>
                  <span className="text-gray-500">5% drop-off</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-orange-600">Slate 3: Advanced Concepts</span>
                  <span className="text-gray-500">25% drop-off</span>
                </div>
                <Progress value={75} className="h-2 [&>div]:bg-orange-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Slate 5: Final Project</span>
                  <span className="text-gray-500">10% drop-off</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-6 text-primary">View Full Analytics</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
