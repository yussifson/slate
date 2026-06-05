import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, TrendingUp, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OnlineCommunity() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community & Forums</h1>
          <p className="text-gray-500 mt-1">Engage with students, answer questions, and build discussions.</p>
        </div>
        <Button className="bg-[#0056D2] hover:bg-[#004bb5] text-white"><Plus className="h-4 w-4 mr-2" /> New Topic</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-[#0056D2] bg-blue-50 font-semibold">
                <MessageSquare className="h-5 w-5 mr-3" /> All Discussions
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-[#0056D2] hover:bg-blue-50">
                <Users className="h-5 w-5 mr-3" /> Student Groups
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-[#0056D2] hover:bg-blue-50">
                <TrendingUp className="h-5 w-5 mr-3" /> Trending Topics
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-xl bg-gradient-to-br from-[#0056D2] to-blue-800 text-white">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">Community Stats</h3>
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-blue-200 text-sm">Active Members</p>
                  <p className="text-2xl font-bold">12,450</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Posts this week</p>
                  <p className="text-2xl font-bold">342</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-0 shadow-sm rounded-xl mb-6">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input placeholder="Search discussions..." className="pl-10 border-gray-200" />
              </div>
              <Button variant="outline" className="border-gray-200">Filter</Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {[
              { title: "Help with Neural Network Assignment (Week 3)", author: "Sarah M.", replies: 12, views: 145, time: "2 hours ago", tag: "Help Required" },
              { title: "React 18 vs React 19: What should I learn?", author: "David K.", replies: 45, views: 890, time: "5 hours ago", tag: "Discussion" },
              { title: "Looking for study partners for Data Science certification", author: "Priya P.", replies: 8, views: 56, time: "1 day ago", tag: "Networking" },
              { title: "Instructor Announcement: Office hours rescheduled", author: "Dr. Andrew Ng", replies: 3, views: 230, time: "2 days ago", tag: "Announcement", isInstructor: true },
            ].map((topic, i) => (
              <Card key={i} className="border-0 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-blue-100 group">
                <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      {topic.isInstructor ? (
                        <Badge className="bg-blue-100 text-[#0056D2] hover:bg-blue-100">Instructor Post</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-gray-600">{topic.tag}</Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#0056D2] transition-colors">{topic.title}</h3>
                    <p className="text-sm text-gray-500">Posted by <span className="font-medium text-gray-700">{topic.author}</span> • {topic.time}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 w-full md:w-auto justify-start md:justify-end border-t md:border-0 pt-3 md:pt-0">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{topic.replies}</div>
                      <div className="text-xs uppercase tracking-wider">Replies</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{topic.views}</div>
                      <div className="text-xs uppercase tracking-wider">Views</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <Button variant="outline" className="text-[#0056D2] border-[#0056D2]">Load More Discussions</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
