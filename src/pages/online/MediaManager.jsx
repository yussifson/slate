import React from 'react';
import { Card } from "@/components/ui/card";
import { Folder, FileVideo, Image as ImageIcon, FileText, Upload, Search, Filter } from 'lucide-react';

export default function MediaManager() {
  return (
    <div className="h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary overflow-hidden">
      <div className="px-8 py-6 border-b border-border bg-overlay shrink-0 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-display font-medium mb-1 flex items-center gap-2">
                <Folder className="w-6 h-6 text-orbit" /> Media Manager
            </h1>
            <p className="text-text-secondary text-sm">Organize and upload all your course assets.</p>
        </div>
        <button className="orbit-btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Asset
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="flex gap-4 mb-8">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input type="text" placeholder="Search files..." className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-orbit" />
              </div>
              <button className="orbit-btn-secondary px-3 py-2 flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4" /> Filter
              </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[
                  { name: 'Intro_Video_v2.mp4', type: 'video', size: '124 MB' },
                  { name: 'UI_Kit_Assets.zip', type: 'file', size: '45 MB' },
                  { name: 'Course_Thumbnail.png', type: 'image', size: '2.4 MB' },
                  { name: 'React_Hooks_Cheatsheet.pdf', type: 'file', size: '1.2 MB' },
                  { name: 'Lesson_3_Recording.mp4', type: 'video', size: '310 MB' }
              ].map((file, i) => (
                  <Card key={i} className="bg-deep border-border p-4 hover:border-orbit/50 transition-colors flex flex-col items-center justify-center text-center group cursor-pointer">
                      <div className="w-16 h-16 bg-surface rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          {file.type === 'video' && <FileVideo className="w-8 h-8 text-emerald-400" />}
                          {file.type === 'image' && <ImageIcon className="w-8 h-8 text-amber-400" />}
                          {file.type === 'file' && <FileText className="w-8 h-8 text-orbit" />}
                      </div>
                      <div className="text-sm font-medium text-white truncate w-full px-2" title={file.name}>{file.name}</div>
                      <div className="text-xs text-text-muted mt-1">{file.size}</div>
                  </Card>
              ))}
          </div>
      </div>
    </div>
  );
}
