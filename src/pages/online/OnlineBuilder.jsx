import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Save, Video, FileText, CheckSquare, Award } from "lucide-react";

export default function OnlineBuilder() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Builder</h1>
          <p className="text-gray-500 mt-1">Create and organize your course curriculum.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="text-[#0056D2] border-[#0056D2]">Preview Course</Button>
          <Button className="bg-[#0056D2] hover:bg-[#004bb5] text-white flex items-center gap-2"><Save className="h-4 w-4"/> Publish</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-[#0056D2] hover:bg-blue-50">
                <Video className="h-5 w-5 mr-3" /> Video Lesson
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-[#0056D2] hover:bg-blue-50">
                <FileText className="h-5 w-5 mr-3" /> Reading Material
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-[#0056D2] hover:bg-blue-50">
                <CheckSquare className="h-5 w-5 mr-3" /> Quiz / Assessment
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-[#0056D2] hover:bg-blue-50">
                <Award className="h-5 w-5 mr-3" /> Certificate
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader>
              <Input placeholder="Enter Course Title..." className="text-2xl font-bold border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#0056D2]" />
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="curriculum" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
                  <TabsTrigger value="curriculum" className="data-[state=active]:border-b-2 data-[state=active]:border-[#0056D2] data-[state=active]:text-[#0056D2] rounded-none h-full px-6">Curriculum</TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-[#0056D2] data-[state=active]:text-[#0056D2] rounded-none h-full px-6">Settings</TabsTrigger>
                  <TabsTrigger value="pricing" className="data-[state=active]:border-b-2 data-[state=active]:border-[#0056D2] data-[state=active]:text-[#0056D2] rounded-none h-full px-6">Pricing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="curriculum" className="pt-6">
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Module 1: Introduction</h3>
                        <Button variant="ghost" size="sm" className="text-gray-500"><PlusCircle className="h-4 w-4 mr-2" /> Add Item</Button>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-white p-3 rounded border flex justify-between items-center group hover:border-[#0056D2] transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Video className="h-5 w-5 text-gray-400" />
                            <span>Welcome to the Course</span>
                          </div>
                          <span className="text-sm text-gray-400">5:00</span>
                        </div>
                        <div className="bg-white p-3 rounded border flex justify-between items-center group hover:border-[#0056D2] transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <span>Course Syllabus</span>
                          </div>
                          <span className="text-sm text-gray-400">PDF</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full border-dashed py-8 text-gray-500 hover:text-[#0056D2] hover:border-[#0056D2] hover:bg-blue-50">
                      <PlusCircle className="h-5 w-5 mr-2" /> Add New Module
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="pt-6">
                  <p className="text-gray-500">Course settings, thumbnail, and descriptions will go here.</p>
                </TabsContent>

                <TabsContent value="pricing" className="pt-6">
                  <p className="text-gray-500">Set up pricing, subscriptions, and discounts here.</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
