import React from 'react';
import { HelpCircle, FileText, MessageCircle, PhoneCall, BookOpen, ExternalLink, Search } from 'lucide-react';

export default function AccountHelp() {
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <HelpCircle className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl md:text-4xl font-normal text-gray-900 dark:text-white mb-4">How can we help you?</h1>
        
        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative mt-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            className="block w-full pl-11 pr-4 py-4 rounded-2xl border-none shadow-md ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-[#28292C] text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary transition-shadow text-lg" 
            placeholder="Search help topics..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        {/* Help Topics */}
        <div className="p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">Documentation</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
            Detailed guides and documentation for all Optavel ecosystem products including Slate and Preloom.
          </p>
          <div className="text-primary text-sm font-medium flex items-center gap-1">
            Browse Docs <ExternalLink className="w-4 h-4" />
          </div>
        </div>

        <div className="p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">Tutorials & Guides</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
            Step-by-step video tutorials and quick start guides to help you get the most out of your account.
          </p>
          <div className="text-primary text-sm font-medium flex items-center gap-1">
            View Tutorials <ExternalLink className="w-4 h-4" />
          </div>
        </div>

        {/* Contact Support */}
        <div className="p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">Chat Support</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
            Get instant help from our AI assistant or connect with a human support agent.
          </p>
          <div className="text-primary text-sm font-medium flex items-center gap-1">
            Start Chat
          </div>
        </div>

        <div className="p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <PhoneCall className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">Phone Support</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
            Premium accounts can schedule a direct call with our technical support team.
          </p>
          <div className="text-primary text-sm font-medium flex items-center gap-1">
            Schedule Call
          </div>
        </div>
      </div>
    </div>
  );
}
