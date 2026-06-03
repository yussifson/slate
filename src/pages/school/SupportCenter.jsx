import React from 'react';
import { useTranslation } from 'react-i18next';
import { LifeBuoy, Search, Book, FileQuestion, Lightbulb, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SupportCenter() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl text-white text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <LifeBuoy className="w-16 h-16 mb-4 opacity-90" />
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">How can we help you today?</h1>
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search for guides, FAQs, or support articles..." className="pl-12 py-6 rounded-full text-lg text-foreground bg-white shadow-xl border-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Book className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground mb-4">Browse our comprehensive guides and tutorials on how to use the platform.</p>
          <Button variant="link" className="px-0 text-blue-600">Browse Articles &rarr;</Button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">FAQs</h3>
          <p className="text-sm text-muted-foreground mb-4">Quick answers to the most commonly asked questions by students and staff.</p>
          <Button variant="link" className="px-0 text-amber-600">View FAQs &rarr;</Button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Contact IT Support</h3>
          <p className="text-sm text-muted-foreground mb-4">Can't find what you're looking for? Reach out to our 24/7 IT helpdesk.</p>
          <Button variant="link" className="px-0 text-green-600">Open Chat &rarr;</Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center">
        <Lightbulb className="w-8 h-8 mx-auto text-yellow-500 mb-4" />
        <h3 className="text-lg font-bold mb-2">Have a Feature Request?</h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">We are constantly improving the platform. If you have an idea for a new feature, let us know!</p>
        <Button className="bg-foreground text-background hover:bg-foreground/90">Submit Idea</Button>
      </div>
    </div>
  );
}
