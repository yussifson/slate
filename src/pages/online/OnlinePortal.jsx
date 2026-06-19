import React from 'react';
import { Card, CardContent} from "@/components/ui/card";
import { Progress} from "@/components/ui/progress";
import { Button} from "@/components/ui/button";
import { PlayCircle, Award, Calendar, FileText} from "lucide-react";

export default function OnlinePortal() {
 return (
 <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-[#F5F7F8] min-h-screen">
 <div className="mb-8">
 <h1 className="text-3xl font-semibold text-gray-900 tracking-[-0.02em]">My Learning Portal</h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1">Pick up where you left off and track your progress.</p>
 </div>

 <h2 className="text-xl font-semibold text-gray-900 mb-4">In Progress</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
 <Card className="border-0 rounded-xl overflow-hidden transition-">
 <img src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Course" className="h-40 w-full object-cover" />
 <CardContent className="p-5">
 <p className="text-xs font-semibold text-primary mb-1 tracking-[0.04em]">COURSE</p>
 <h3 className="font-semibold text-lg mb-2">Machine Learning Specialization</h3>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-4">Slate 3: Neural Networks and Deep Learning</p>
 <div className="space-y-2">
 <div className="flex justify-between text-sm">
 <span className="font-medium text-gray-700">45% Completed</span>
 <span className="text-[#71717a] dark:text-gray-400">4 weeks left</span>
 </div>
 <Progress value={45} className="h-2 bg-gray-200" />
 </div>
 <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-white">Resume Course</Button>
 </CardContent>
 </Card>

 <Card className="border-0 rounded-xl overflow-hidden transition-">
 <img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Course" className="h-40 w-full object-cover" />
 <CardContent className="p-5">
 <p className="text-xs font-semibold text-primary mb-1 tracking-[0.04em]">PROFESSIONAL CERTIFICATE</p>
 <h3 className="font-semibold text-lg mb-2">React Web Development</h3>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-4">Slate 1: React Basics</p>
 <div className="space-y-2">
 <div className="flex justify-between text-sm">
 <span className="font-medium text-gray-700">10% Completed</span>
 <span className="text-[#71717a] dark:text-gray-400">6 weeks left</span>
 </div>
 <Progress value={10} className="h-2 bg-gray-200" />
 </div>
 <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-white">Resume Course</Button>
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <h2 className="text-xl font-semibold text-gray-900">Up Next for You</h2>
 <Card className="border-0 rounded-xl p-0 overflow-hidden">
 <div className="flex flex-col sm:flex-row items-center p-4 group hover:bg-gray-50 transition-colors border-b last:border-0 cursor-pointer">
 <div className="bg-slate-100 p-3 rounded-full text-primary mr-4">
 <PlayCircle className="h-6 w-6" />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">Video: Introduction to Neural Networks</h4>
 <p className="text-sm text-[#71717a] dark:text-gray-400">Machine Learning Specialization</p>
 </div>
 <span className="text-sm font-medium text-gray-400 mt-2 sm:mt-0">15 min</span>
 </div>
 <div className="flex flex-col sm:flex-row items-center p-4 group hover:bg-gray-50 transition-colors border-b last:border-0 cursor-pointer">
 <div className="bg-orange-100 p-3 rounded-full text-orange-600 mr-4">
 <FileText className="h-6 w-6" />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">Reading: Setting up your environment</h4>
 <p className="text-sm text-[#71717a] dark:text-gray-400">React Web Development</p>
 </div>
 <span className="text-sm font-medium text-gray-400 mt-2 sm:mt-0">10 min</span>
 </div>
 <div className="flex flex-col sm:flex-row items-center p-4 group hover:bg-gray-50 transition-colors border-b last:border-0 cursor-pointer">
 <div className="bg-slate-100 p-3 rounded-full text-primary mr-4">
 <Award className="h-6 w-6" />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">Quiz: Python Basics Review</h4>
 <p className="text-sm text-[#71717a] dark:text-gray-400">Data Science Fundamentals</p>
 </div>
 <span className="text-sm font-medium text-primary mt-2 sm:mt-0">Due Today</span>
 </div>
 </Card>
 </div>

 <div className="lg:col-span-1 space-y-6">
 <h2 className="text-xl font-semibold text-gray-900">Upcoming Deadlines</h2>
 <Card className="border-0 rounded-xl p-6 bg-white dark:bg-slate-900/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex gap-4">
 <div className="flex flex-col items-center justify-center bg-red-50 text-red-600 rounded-xl p-2 min-w-[60px]">
 <span className="text-xs font-semibold uppercase tracking-[0.04em]">Oct</span>
 <span className="text-xl font-semibold">15</span>
 </div>
 <div>
 <h4 className="font-semibold text-gray-900">Assignment 1: Regression</h4>
 <p className="text-sm text-[#71717a] dark:text-gray-400">Machine Learning</p>
 <p className="text-xs text-red-500 font-medium mt-1 tracking-[0.04em]">Due in 2 days</p>
 </div>
 </div>
 <div className="h-[1px] w-full bg-gray-100 my-4"></div>
 <div className="flex gap-4">
 <div className="flex flex-col items-center justify-center bg-gray-100 text-gray-600 rounded-xl p-2 min-w-[60px]">
 <span className="text-xs font-semibold uppercase tracking-[0.04em]">Oct</span>
 <span className="text-xl font-semibold">20</span>
 </div>
 <div>
 <h4 className="font-semibold text-gray-900">Quiz: Components</h4>
 <p className="text-sm text-[#71717a] dark:text-gray-400">React Web Dev</p>
 </div>
 </div>
 <Button variant="outline" className="w-full mt-6 text-primary border-primary hover:bg-slate-50">View Calendar</Button>
 </Card>
 </div>
 </div>
 </div>
 );
}
