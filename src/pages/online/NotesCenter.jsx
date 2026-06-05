import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Search, FileText, PlayCircle, Clock, MoreVertical, Trash2, ExternalLink } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NotesCenter() {
  const [search, setSearch] = useState('');

  // Dummy data for notes taken across various courses
  const [notes, setNotes] = useState([
    { 
        id: 1, 
        course: "UI Design Fundamentals", 
        lesson: "3. Layout Composition", 
        timestamp: "12:34", 
        content: "Flexbox solves complex layout issues with a simpler 1D model. Main axis vs Cross axis is crucial to understand before moving to Grid.",
        date: "2026-06-05" 
    },
    { 
        id: 2, 
        course: "Advanced React Patterns", 
        lesson: "5. Custom Hooks", 
        timestamp: "08:15", 
        content: "Remember to use useDebugValue for custom hooks to make them easier to inspect in DevTools. Don't over-abstract too early.",
        date: "2026-06-03" 
    },
    { 
        id: 3, 
        course: "Advanced React Patterns", 
        lesson: "2. Context API", 
        timestamp: "22:10", 
        content: "Context is NOT for state management, it's for dependency injection. Use it to avoid prop drilling, not to replace Redux.",
        date: "2026-06-02" 
    }
  ]);

  const filteredNotes = notes.filter(n => 
      n.content.toLowerCase().includes(search.toLowerCase()) || 
      n.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F7F8] font-sans pb-20">
      <div className="bg-[#1A1A1A] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Notes Center</h1>
            <p className="text-gray-400 text-lg max-w-2xl">Review, search, and export all the notes you've taken across your enrolled courses.</p>
            
            <div className="mt-8 relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                    placeholder="Search your notes..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-14 bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-xl text-lg focus:ring-[#0056D2]" 
                />
            </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
          {filteredNotes.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">No notes found</h3>
                  <p className="text-gray-500 mt-2 mb-6">Take notes while watching lectures to see them here.</p>
              </div>
          ) : (
              <div className="space-y-6">
                  {filteredNotes.map(note => (
                      <Card key={note.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
                          <CardContent className="p-0">
                              <div className="flex flex-col md:flex-row border-l-4 border-[#0056D2]">
                                  {/* Context Area */}
                                  <div className="w-full md:w-1/3 bg-gray-50 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                                      <div>
                                          <h4 className="font-bold text-gray-900 line-clamp-1 mb-1">{note.course}</h4>
                                          <p className="text-sm text-gray-500 mb-4">{note.lesson}</p>
                                          
                                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#0056D2] rounded-full text-xs font-bold font-mono">
                                              <PlayCircle className="w-3 h-3" /> {note.timestamp}
                                          </div>
                                      </div>
                                      
                                      <div className="mt-4 text-xs text-gray-400 font-medium">
                                          Taken on {new Date(note.date).toLocaleDateString()}
                                      </div>
                                  </div>
                                  
                                  {/* Content Area */}
                                  <div className="w-full md:w-2/3 p-6 relative">
                                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#0056D2]"><ExternalLink className="w-4 h-4" /></Button>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                                      </div>
                                      
                                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed pr-16 whitespace-pre-wrap">
                                          {note.content}
                                      </div>
                                  </div>
                              </div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}
