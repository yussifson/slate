import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { MessageSquare, Users, TrendingUp, Search, Plus, ThumbsUp, MessageCircle, MoreVertical } from 'lucide-react';

export default function OnlineCommunity() {
  const [activeTab, setActiveTab] = useState('popular');

  const discussions = [
    { id: 1, author: "Alex J.", avatar: "A", title: "Best resources for learning React Hooks in depth?", content: "I've gone through the basic tutorial but I'm looking for some advanced use cases for useMemo and useCallback. Any suggestions?", replies: 24, likes: 156, tags: ["React", "Advanced"], time: "2 hours ago" },
    { id: 2, author: "Sarah W.", avatar: "S", title: "Showcase: My final project for UI Fundamentals", content: "Hey everyone! I just finished the final project for the UI Design course. I redesigned a local coffee shop's mobile app. Would love some feedback!", replies: 42, likes: 320, tags: ["Design", "Showcase"], time: "5 hours ago" },
    { id: 3, author: "Michael C.", avatar: "M", title: "Stuck on Module 4 Assignment - Help!", content: "I keep getting a CORS error when trying to fetch data from the mock API provided in the assignment. Here is my fetch function...", replies: 8, likes: 12, tags: ["Help", "API"], time: "1 day ago" },
  ];

  return (
    <div className="h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-overlay shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-display font-medium mb-1 flex items-center gap-2">
                <Users className="w-6 h-6 text-orbit" /> Learner Community
            </h1>
            <p className="text-text-secondary text-sm">Ask questions, share projects, and network with peers globally.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="text" placeholder="Search discussions..." className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-orbit" />
            </div>
            <button className="orbit-btn-primary px-4 py-2 text-sm flex items-center gap-2 shrink-0">
                <Plus className="w-4 h-4" /> New Topic
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
          
          {/* Main Feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-4xl mx-auto">
                  
                  {/* Tabs */}
                  <div className="flex gap-1 bg-surface p-1 rounded-lg border border-border inline-flex mb-8">
                      {['popular', 'recent', 'my_posts'].map(tab => (
                          <button 
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-orbit text-orbit-light shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                          >{tab.replace('_', ' ')}</button>
                      ))}
                  </div>

                  <div className="space-y-4">
                      {discussions.map(post => (
                          <Card key={post.id} className="bg-deep border-border hover:border-orbit/50 transition-colors p-6 flex gap-4 cursor-pointer">
                              <div className="shrink-0 flex flex-col items-center gap-2">
                                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-orbit font-bold text-lg">
                                      {post.avatar}
                                  </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                      <h3 className="font-display font-medium text-lg text-white hover:text-orbit transition-colors line-clamp-1">{post.title}</h3>
                                      <button className="text-text-muted hover:text-text-primary p-1"><MoreVertical className="w-4 h-4" /></button>
                                  </div>
                                  <div className="text-xs text-text-muted mb-3 flex items-center gap-2">
                                      <span className="font-medium text-text-secondary">{post.author}</span> • <span>{post.time}</span>
                                  </div>
                                  <p className="text-text-secondary text-sm mb-4 line-clamp-2 leading-relaxed">
                                      {post.content}
                                  </p>
                                  <div className="flex items-center justify-between">
                                      <div className="flex gap-2">
                                          {post.tags.map(tag => (
                                              <span key={tag} className="px-2 py-1 bg-surface text-text-secondary border border-border rounded text-[10px] uppercase tracking-wider font-medium">
                                                  {tag}
                                              </span>
                                          ))}
                                      </div>
                                      <div className="flex items-center gap-4 text-text-muted text-sm font-medium">
                                          <div className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                                              <ThumbsUp className="w-4 h-4" /> {post.likes}
                                          </div>
                                          <div className="flex items-center gap-1.5 hover:text-orbit transition-colors">
                                              <MessageCircle className="w-4 h-4" /> {post.replies}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </Card>
                      ))}
                  </div>
              </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 border-l border-border bg-overlay p-6 overflow-y-auto custom-scrollbar shrink-0">
              
              <div className="mb-8">
                  <h3 className="text-sm font-display font-medium text-text-secondary uppercase tracking-widest mb-4">Trending Topics</h3>
                  <div className="space-y-3">
                      {[
                          { tag: "React", count: "1.2k posts" },
                          { tag: "CareerAdvice", count: "856 posts" },
                          { tag: "PortfolioReview", count: "643 posts" },
                          { tag: "Web3", count: "420 posts" }
                      ].map((t, i) => (
                          <div key={i} className="flex justify-between items-center cursor-pointer group">
                              <span className="text-sm font-medium text-orbit-light group-hover:underline">#{t.tag}</span>
                              <span className="text-xs text-text-muted">{t.count}</span>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="mb-8">
                  <h3 className="text-sm font-display font-medium text-text-secondary uppercase tracking-widest mb-4">Top Contributors</h3>
                  <div className="space-y-4">
                      {[
                          { name: "David K.", points: 15420, badge: "Master" },
                          { name: "Emily R.", points: 12100, badge: "Expert" },
                          { name: "John S.", points: 9850, badge: "Mentor" }
                      ].map((u, i) => (
                          <div key={i} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orbit/20 flex items-center justify-center text-orbit text-xs font-bold">
                                  {u.name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white truncate">{u.name}</div>
                                  <div className="text-[10px] text-text-muted">{u.badge} • {u.points} pts</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="bg-gradient-to-br from-orbit/20 to-deep border border-orbit/30 p-5 rounded-xl">
                  <h4 className="font-display font-medium text-white mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orbit" /> Level Up
                  </h4>
                  <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                      Help others in the community to earn points, unlock exclusive badges, and gain access to beta courses!
                  </p>
                  <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-orbit w-[60%]"></div>
                  </div>
                  <div className="text-right text-[10px] text-text-muted mt-1">400 pts to next level</div>
              </div>

          </div>
      </div>
    </div>
  );
}
