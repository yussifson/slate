import React, { useState } from 'react';
import { Book, Globe, Shield, RefreshCw, FileText, Search, Download } from 'lucide-react';
import OrbitEmptyState from '@/components/university/OrbitEmptyState';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

export default function UniLibrary() {
  const [digitalItems] = useState([
    { title: "Introduction to Algorithmic Analysis", author: "Dr. Cormen", type: "Digital PDF", date: "2024" },
    { title: "Journal of Distributed consensus & Blockchains", author: "Academic Press", type: "Journal Article", date: "2025" },
    { title: "Vector Calculus & Mechanics", author: "Feynman", type: "Digital Book", date: "2023" }
  ]);

  const stats = [
    { label: 'Physical Volumes', value: '45,000', icon: Book, color: 'var(--color-module-library)' },
    { label: 'Digital Assets', value: '12,800', icon: Globe, color: 'var(--color-info)' },
    { label: 'Active Borrows', value: '324', icon: RefreshCw, color: 'var(--color-warning)' },
    { label: 'Subscribed Journals', value: '24', icon: Shield, color: 'var(--color-success)' }
  ];

  const inputClass = "w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-module-library)] focus:ring-1 focus:ring-[var(--color-module-library)] font-body";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-[var(--color-border-subtle)] pb-4">
        <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">University Library System</h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Search physical catalogs, browse digital repository directories, and review academic journals.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[var(--tracking-widest)]">{stat.label}</p>
                <h3 className="text-[var(--text-3xl)] font-display font-semibold text-[var(--color-text-primary)] mt-1 tracking-tight">{stat.value}</h3>
              </div>
              <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[var(--color-border-subtle)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Digital Library & Repository</h2>
            <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Browse online publications, lecture notes, and research materials.</p>
          </div>
          <div className="p-6 space-y-4">
            {digitalItems.map((item, idx) => (
              <div key={idx} className="p-4 bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] flex justify-between items-center text-[var(--text-xs)]">
                <div>
                  <h4 className="font-bold text-[var(--text-sm)] text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <FileText className="w-4 h-4" style={{ color: 'var(--color-module-library)' }} /> {item.title}
                  </h4>
                  <p className="text-[var(--color-text-secondary)] mt-1">Author: {item.author} · Published: {item.date}</p>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-module-library)] hover:opacity-90 text-white font-medium rounded-[var(--radius-md)] transition-all text-xs">
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 h-fit shadow-sm">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Catalog Search</h2>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-4">Search the physical catalog database.</p>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input type="text" placeholder="Search books, authors..." className={inputClass} />
            </div>
            <button className="w-full py-2 bg-[var(--color-module-library)] hover:opacity-90 text-white font-medium rounded-[var(--radius-md)] transition-all text-sm">
              Query Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
