import React, { useState} from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter} from "@/components/ui/card";
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { Badge} from "@/components/ui/badge";
import { Search, Star, BookOpen, Clock, Filter, ArrowRight} from "lucide-react";
import { Link, useNavigate} from 'react-router-dom';

export default function OnlineMarketplace() {
 const [searchQuery, setSearchQuery] = useState('');
 const navigate = useNavigate();

 const courses = [
 {
 id: 1,
 title: "Machine Learning Specialization",
 instructor: "Dr. Andrew Ng",
 rating: 4.9,
 reviews: "120k",
 level: "Intermediate",
 duration: "3 months",
 price: "$49/month",
 tag: "Top Rated",
 image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
},
 {
 id: 2,
 title: "Google Data Analytics Professional Certificate",
 instructor: "Google",
 rating: 4.8,
 reviews: "95k",
 level: "Beginner",
 duration: "6 months",
 price: "$39/month",
 tag: "Popular",
 image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
},
 {
 id: 3,
 title: "Full-Stack Web Development with React",
 instructor: "Meta",
 rating: 4.7,
 reviews: "50k",
 level: "Beginner",
 duration: "4 months",
 price: "$49/month",
 tag: "New",
 image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
}
 ];

 return (
 <div className="min-h-screen bg-[#F5F7F8] font-sans">
 {/* Navbar */}
 <nav className="bg-white dark:bg-slate-900/40 border-b border-gray-200 sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between h-16 items-center">
 <div className="flex items-center space-x-8">
 <span className="text-2xl font-bold text-primary">Learn<span className="text-gray-800">Sphere</span></span>
 <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-600">
 <a href="#" className="hover:text-primary">Explore</a>
 <a href="#" className="hover:text-primary">Degrees</a>
 <a href="#" className="hover:text-primary">Certificates</a>
 </div>
 </div>
 <div className="flex items-center space-x-4">
 <Button variant="ghost" onClick={() => navigate('/login')} className="text-primary hover:bg-slate-50 dark:bg-slate-800/50 font-semibold">Log In</Button>
 <Button onClick={() => navigate('/signup')} className="bg-primary hover:bg-primary/90 text-white font-semibold">Join for Free</Button>
 </div>
 </div>
 </div>
 </nav>

 {/* Hero Section */}
 <div className="bg-white dark:bg-slate-900/40 pb-12 pt-16 border-b border-gray-200">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
 <div className="md:w-1/2 space-y-6">
 <h1 className="text-5xl font-bold text-gray-900 leading-tight">Learn without limits</h1>
 <p className="text-xl text-gray-600">Start, switch, or advance your career with more than 5,000 courses, Professional Certificates, and degrees from world-class universities and companies.</p>
 <div className="flex space-x-4 pt-4">
 <Button onClick={() => navigate('/signup')} className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-md">Join for Free</Button>
 <Button variant="outline" className="text-primary border-primary hover:bg-slate-50 dark:bg-slate-800/50 px-8 py-6 text-lg rounded-md">Try Coursera for Business</Button>
 </div>
 </div>
 <div className="md:w-1/2">
 <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Students learning" className="rounded-xl " />
 </div>
 </div>
 </div>

 {/* Search and Filters */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 <div className="flex flex-col md:flex-row gap-4 items-center mb-10">
 <div className="relative w-full md:w-2/3">
 <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
 <Input 
 placeholder="What do you want to learn?" 
 className="pl-12 py-6 text-lg rounded-full border-2 border-gray-300 focus-visible:ring-primary w-full"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 <Button variant="outline" className="hidden md:flex items-center gap-2 py-6 px-6 rounded-full border-2 text-gray-700">
 <Filter className="h-5 w-5" /> Filters
 </Button>
 </div>

 <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Professional Certificates</h2>
 
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {courses.map(course => (
 <Card key={course.id} className="overflow-hidden transition-all duration-300 border-gray-200 cursor-pointer group rounded-xl">
 <div className="relative h-48 overflow-hidden">
 <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
 <Badge className="absolute top-4 left-4 bg-white dark:bg-slate-900/40/90 text-primary hover:bg-white dark:bg-slate-900/40">{course.tag}</Badge>
 </div>
 <CardContent className="p-6">
 <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
 <span className="font-semibold text-gray-800">{course.instructor}</span>
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
 <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
 <div className="flex items-center gap-1 text-yellow-500 font-semibold">
 <Star className="h-4 w-4 fill-current" />
 <span>{course.rating}</span>
 <span className="text-gray-400 font-normal">({course.reviews})</span>
 </div>
 </div>
 <div className="flex items-center gap-4 text-sm text-gray-500">
 <div className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {course.level}</div>
 <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {course.duration}</div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 
 {/* Value Proposition */}
 <div className="bg-gray-50 py-16 mt-12 border-t border-gray-200">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
 <h2 className="text-3xl font-bold text-gray-900 mb-12">World-class learning for anyone, anywhere</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="p-6 bg-white dark:bg-slate-900/40 rounded-xl border border-gray-100">
 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
 <BookOpen className="h-8 w-8" />
 </div>
 <h3 className="text-xl font-bold mb-3">Learn anything</h3>
 <p className="text-gray-600">Explore any interest or trending topic, take prerequisites, and advance your skills.</p>
 </div>
 <div className="p-6 bg-white dark:bg-slate-900/40 rounded-xl border border-gray-100">
 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
 <Star className="h-8 w-8" />
 </div>
 <h3 className="text-xl font-bold mb-3">Save money</h3>
 <p className="text-gray-600">Spend less money on your learning if you plan to take multiple courses this year.</p>
 </div>
 <div className="p-6 bg-white dark:bg-slate-900/40 rounded-xl border border-gray-100">
 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
 <Clock className="h-8 w-8" />
 </div>
 <h3 className="text-xl font-bold mb-3">Flexible learning</h3>
 <p className="text-gray-600">Learn at your own pace, move between multiple courses, or switch to a different course.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
