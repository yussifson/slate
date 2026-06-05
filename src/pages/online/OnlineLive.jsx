import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, Users, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OnlineLive() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Learning</h1>
          <p className="text-gray-500 mt-1">Join live classes, webinars, and access recordings.</p>
        </div>
        <Button className="bg-[#0056D2] hover:bg-[#004bb5] text-white flex items-center gap-2"><Video className="h-4 w-4" /> Start Instant Meeting</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-[#0056D2] text-white">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 space-y-4">
                <Badge variant="secondary" className="bg-red-500 text-white hover:bg-red-600 border-0 flex items-center gap-1 w-max">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> Live Now
                </Badge>
                <h2 className="text-2xl font-bold">Office Hours: Machine Learning Specialization</h2>
                <p className="text-blue-100">Join Dr. Andrew Ng to discuss the latest assignment and get your questions answered.</p>
                <div className="flex items-center gap-4 text-sm text-blue-200">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4"/> 142 watching</span>
                </div>
                <Button className="bg-white text-[#0056D2] hover:bg-gray-100 font-bold mt-2 w-max">Join Session</Button>
              </div>
              <div className="w-full md:w-1/3 bg-blue-800 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden shadow-lg border border-blue-400">
                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Live stream preview" className="w-full h-full object-cover opacity-60" />
                <PlayCircle className="h-12 w-12 text-white absolute opacity-80" />
              </div>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold text-gray-900 pt-4">Upcoming Webinars</h2>
          <div className="space-y-4">
            {[
              { title: "React 18 New Features Deep Dive", host: "Meta Instructor Team", time: "Today, 3:00 PM EST", type: "Webinar" },
              { title: "Data Science Q&A", host: "IBM Data Science", time: "Tomorrow, 1:00 PM EST", type: "Q&A Session" },
              { title: "Guest Lecture: AI in Healthcare", host: "Dr. Sarah Chen", time: "Fri, Oct 24, 10:00 AM EST", type: "Guest Lecture" },
            ].map((w, i) => (
              <Card key={i} className="border-0 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex p-5 gap-5">
                  <div className="hidden sm:flex flex-col items-center justify-center bg-blue-50 text-[#0056D2] rounded-lg p-3 min-w-[80px]">
                    <Calendar className="h-6 w-6 mb-1" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Badge variant="outline" className="mb-1 text-gray-500 border-gray-200">{w.type}</Badge>
                    <h3 className="font-bold text-lg text-gray-900">{w.title}</h3>
                    <p className="text-sm text-gray-500">Host: {w.host}</p>
                    <p className="text-sm font-medium text-[#0056D2] mt-2">{w.time}</p>
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <Button variant="outline" className="border-[#0056D2] text-[#0056D2] hover:bg-blue-50">Register</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Recordings</h2>
          <div className="space-y-4">
            {[
              { title: "Intro to Neural Networks Review", duration: "45m", date: "Oct 12" },
              { title: "State Management in React", duration: "1h 15m", date: "Oct 10" },
              { title: "Course Orientation", duration: "30m", date: "Oct 01" },
            ].map((r, i) => (
              <Card key={i} className="border-0 shadow-sm rounded-xl overflow-hidden hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex p-3 gap-3">
                  <div className="w-24 h-16 bg-gray-200 rounded relative flex items-center justify-center overflow-hidden shrink-0">
                    <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=60" className="w-full h-full object-cover" alt="thumbnail" />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-[#0056D2]">{r.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{r.duration}</span>
                      <span>•</span>
                      <span>{r.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Button variant="ghost" className="w-full text-[#0056D2]">View All Recordings</Button>
        </div>
      </div>
    </div>
  );
}
