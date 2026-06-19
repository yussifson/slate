import React from 'react';
import { useSubscription} from '@/hooks/useSubscription';
import { Lock} from 'lucide-react';
import { cn} from '@/lib/utils';
import { useNavigate} from 'react-router-dom';

export default function FeatureGate({ 
 featureName, 
 children, 
 fallback, 
 showOverlay = false 
}) {
 const { hasFeature, isLoading} = useSubscription();
 const navigate = useNavigate();

 if (isLoading) {
 return <div className="animate-pulse bg-muted rounded-lg h-full w-full min-h-[40px]"></div>;
}

 const isAllowed = featureName ? hasFeature(featureName) : true;

 if (isAllowed) {
 return <>{children}</>;
}

 if (showOverlay) {
 return (
 <div className="relative group">
 <div className="opacity-30 pointer-events-none select-none blur-[1px] grayscale">
 {children}
 </div>
 <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-background/40 backdrop-blur-sm z-10 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity">
 <div className="bg-card p-4 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-center max-w-[250px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Lock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
 <h4 className="font-semibold text-sm mb-1">Upgrade Required</h4>
 <p className="text-xs text-[#71717a] dark:text-gray-400 mb-3 tracking-[0.04em]">This feature is not available on your current plan.</p>
 <button 
 onClick={() => navigate('/settings/billing')} 
 className="bg-primary text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-primary/90 tracking-[0.04em]"
 >
 View Plans
 </button>
 </div>
 </div>
 </div>
 );
}

 if (fallback) {
 return <>{fallback}</>;
}

 return null;
}
