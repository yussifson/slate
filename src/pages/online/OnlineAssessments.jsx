import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, FileText, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OnlineAssessments() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-500 mt-1">Manage quizzes, exams, and grading.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-white border-b pb-4">
              <CardTitle className="text-xl">Pending Grading</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  { course: "Machine Learning", assignment: "Week 3: Neural Networks", type: "Peer Review", status: "Requires action", icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-50" },
                  { course: "React Web Dev", assignment: "Final Project Submission", type: "Instructor Grading", status: "15 pending", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
                ].map((item, i) => (
                  <div key={i} className="p-5 flex items-center hover:bg-gray-50 transition-colors">
                    <div className={`p-3 rounded-full mr-4 ${item.bg} ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.assignment}</h4>
                      <p className="text-sm text-gray-500">{item.course} • {item.type}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-medium ${item.color} mb-2`}>{item.status}</span>
                      <Button size="sm" variant="outline" className="border-[#0056D2] text-[#0056D2] hover:bg-blue-50">Review Now</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Auto-Graded Quizzes</CardTitle>
                <Button variant="ghost" size="sm" className="text-[#0056D2]"><RefreshCw className="h-4 w-4 mr-2"/> Sync Results</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { title: "Python Basics Quiz", attempts: 124, avgScore: 85, passRate: 92 },
                  { title: "React State Management", attempts: 89, avgScore: 72, passRate: 65 },
                  { title: "Data Structures", attempts: 210, avgScore: 88, passRate: 95 },
                ].map((q, i) => (
                  <div key={i} className="flex flex-col md:flex-row items-center p-4 border rounded-lg bg-gray-50">
                    <div className="flex-1 mb-4 md:mb-0">
                      <h4 className="font-bold text-gray-900">{q.title}</h4>
                      <p className="text-sm text-gray-500">{q.attempts} attempts this week</p>
                    </div>
                    <div className="flex gap-8 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{q.avgScore}%</div>
                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Avg Score</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${q.passRate > 80 ? 'text-green-600' : 'text-orange-500'}`}>{q.passRate}%</div>
                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Pass Rate</div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-1">Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-sm rounded-xl bg-[#0056D2] text-white">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">Create Assessment</h3>
              <p className="text-blue-100 text-sm mb-6">Build a new quiz, exam, or programming assignment.</p>
              <div className="space-y-3">
                <Button className="w-full bg-white text-[#0056D2] hover:bg-gray-100 font-medium">New Quiz</Button>
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium border border-blue-400">New Assignment</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Recent Completions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "John Doe", score: "95%", badge: "Pass", color: "bg-green-100 text-green-700" },
                  { name: "Alice Smith", score: "100%", badge: "Pass", color: "bg-green-100 text-green-700" },
                  { name: "Bob Wilson", score: "60%", badge: "Fail", color: "bg-red-100 text-red-700" },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{s.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">Score: {s.score}</p>
                      </div>
                    </div>
                    <Badge className={s.color} variant="secondary">{s.badge}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
