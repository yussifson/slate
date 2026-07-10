import React from 'react';
import { X, Building2, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function CompanySelectionModal({ isOpen, onClose }) {
  const { user } = useAuth();
  
  if (!isOpen) return null;

  const availableCompanies = user?.available_companies || [];

  const handleSelectCompany = (company) => {
    // Construct the URL with tokens and company selection
    // Example: https://slate.optavel.com/auth/callback?company_id=123&access_token=...
    const url = new URL('https://slate.optavel.com');
    
    // Fallback: If we can't reliably pass tokens this way due to cross-domain issues in a real app,
    // this demonstrates the URL routing mechanism requested.
    const tokenStr = localStorage.getItem('slate_session');
    if (tokenStr) {
      try {
        const session = JSON.parse(tokenStr);
        if (session.access_token) {
          url.searchParams.append('access_token', session.access_token);
        }
      } catch (e) {}
    }
    
    url.searchParams.append('company_id', company.id);
    url.searchParams.append('action', 'auto_login');
    
    window.location.href = url.toString();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#1C1C1E] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Select Workspace
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose a Slate workspace to continue
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {availableCompanies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No workspaces found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableCompanies.map(company => (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {company.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Role: {company.role || 'Member'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
