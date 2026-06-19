import React, { useState} from 'react';
import { MessageSquare, Users, Heart, Share2, Search, Filter} from 'lucide-react';

export default function OnlineCommunity() {
 const [searchTerm, setSearchTerm] = useState('');

 const posts = [
 { id: 1, author: 'Sarah Jenkins', avatar: 'S', role: 'Instructor', time: '2 hours ago', title: 'Welcome to the React Masterclass!', content: 'I am so excited to have you all here. Please introduce yourselves in the comments below!', likes: 24, comments: 12},
 { id: 2, author: 'Michael Chen', avatar: 'M', role: 'Learner', time: '5 hours ago', title: 'Struggling with useEffect dependencies', content: 'Can someone explain when I should omit a dependency array entirely vs passing an empty array? Im getting infinite loops.', likes: 8, comments: 5},
 ];

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 max-w-5xl mx-auto">
 <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Community Forums</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Connect with instructors and fellow learners.</p>
 </div>
 <button className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity flex items-center gap-2">
 <MessageSquare className="w-4 h-4" /> New Discussion
 </button>
 </div>

 <div className="flex flex-col md:flex-row gap-6">
 <div className="md:w-64 flex-shrink-0 space-y-6">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-4">
 <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">Categories</h3>
 <div className="space-y-1">
 <button className="w-full text-left px-3 py-2 text-sm bg-[var(--color-surface-1)] text-[var(--primary)] font-semibold rounded-md-[var(--radius-md)]">All Discussions</button>
 <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)] rounded-md-[var(--radius-md)] transition-colors">Course Q&A</button>
 <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)] rounded-md-[var(--radius-md)] transition-colors">General Chat</button>
 <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)] rounded-md-[var(--radius-md)] transition-colors">Announcements</button>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-4 text-center">
 <Users className="w-8 h-8 mx-auto text-[var(--primary)] mb-2" />
 <h4 className="font-semibold text-[var(--color-text-primary)]">1,204 Online</h4>
 <p className="text-xs text-[var(--color-text-secondary)] mt-1 tracking-[0.04em]">Active learners right now</p>
 </div>
 </div>

 <div className="flex-1 space-y-6">
 <div className="flex gap-4">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
 <input 
 type="text" 
 placeholder="Search discussions..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
 />
 </div>
 <button className="px-4 py-2 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[var(--color-text-primary)] text-sm font-medium rounded-md-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors flex items-center gap-2">
 <Filter className="w-4 h-4" /> Filter
 </button>
 </div>

 <div className="space-y-4">
 {posts.map(post => (
 <div key={post.id} className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-6 hover:border-[var(--primary)] transition-colors cursor-pointer">
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${post.role === 'Instructor' ? 'bg-[var(--primary)]' : 'bg-[var(--color-surface-3)] text-[var(--color-text-primary)]'}`}>
 {post.avatar}
 </div>
 <div>
 <h4 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
 {post.author}
 {post.role === 'Instructor' && <span className="bg-[var(--color-warning-subtle)] text-[var(--color-warning)] text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider tracking-[0.04em]">Instructor</span>}
 </h4>
 <p className="text-xs text-[var(--color-text-secondary)] tracking-[0.04em]">{post.time}</p>
 </div>
 </div>

 <h3 className="font-semibold text-lg text-[var(--color-text-primary)] mb-2 font-display">{post.title}</h3>
 <p className="text-sm text-[var(--color-text-secondary)] mb-4">{post.content}</p>

 <div className="flex items-center gap-6 pt-4 border-t border-primary/40">
 <button className="flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors tracking-[0.04em]">
 <Heart className="w-4 h-4" /> {post.likes} Likes
 </button>
 <button className="flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors tracking-[0.04em]">
 <MessageSquare className="w-4 h-4" /> {post.comments} Comments
 </button>
 <button className="flex items-center gap-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors ml-auto tracking-[0.04em]">
 <Share2 className="w-4 h-4" /> Share
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
